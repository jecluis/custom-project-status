// Copyright 2023 Joao Eduardo Luis <joao@abysmo.io>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as core from "@actions/core";
import * as github from "@actions/github";
import { ProjectFieldEntry, ProjectQueryResponse } from "./gql-types";
import { Octokit, addProjectItem, getProjectItem } from "./helpers";

type ProjectDesc = {
  owner: string;
  projectNumber: number;
  isOrg: boolean;
};

export type DefaultStatus = {
  issues: string;
  prs: string;
};

function parseURL(url: string): ProjectDesc {
  const regex =
    /\/(?<type>orgs|users)\/(?<owner>[^/]+)\/projects\/(?<prjNumber>\d+)/;
  const match = url.match(regex);
  if (match === null) {
    core.error("Invalid project URL");
    throw new Error(`Invalid project URL: ${url}`);
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    owner: match.groups!.owner,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    projectNumber: parseInt(match.groups!.prjNumber),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    isOrg: match.groups!.type === "orgs",
  };
}

export class Project {
  private octokit: Octokit;
  private desc: ProjectDesc;
  private projectID?: string;
  private fields: { [id: string]: ProjectFieldEntry };
  private defaultStatus: DefaultStatus;

  public constructor(token: string, url: string, defaultStatus: DefaultStatus) {
    this.octokit = github.getOctokit(token);
    this.desc = parseURL(url);
    this.fields = {};
    this.defaultStatus = defaultStatus;
  }

  /**
   * Init project, from its organization/user and number, obtaining its ID, and
   * its fields.
   */
  public async init(): Promise<{ id: string; title: string }> {
    core.debug(
      `project init: owner: ${this.desc.owner}, prj: ${this.desc.projectNumber}, is org: ${this.desc.isOrg}`,
    );

    const projectRes = await this.octokit.graphql<ProjectQueryResponse>(
      `#graphql

      fragment projectV2fields on ProjectV2 {
        id
        title
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }

      query getProject($owner: String!, $projectNumber: Int!, $isOrg: Boolean!) {
        organization(login: $owner) @include(if: $isOrg) {
          projectV2(number: $projectNumber) {
            ...projectV2fields
          }
        }
        user(login: $owner) @skip(if: $isOrg) {
          projectV2(number: $projectNumber) {
            ...projectV2fields
          }
        }
      }
    `,
      {
        owner: this.desc.owner,
        projectNumber: this.desc.projectNumber,
        isOrg: this.desc.isOrg,
      },
    );

    if (this.desc.isOrg && projectRes.organization === undefined) {
      throw new Error("Expected organization result, found none!");
    } else if (!this.desc.isOrg && projectRes.user === undefined) {
      throw new Error("Expected user result, found none!");
    }

    const prjv2 = this.desc.isOrg
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        projectRes.organization!.projectV2
      : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        projectRes.user!.projectV2;

    const res = {
      id: prjv2.id,
      title: prjv2.title,
    };

    this.projectID = res.id;
    this.initFields(prjv2.fields.nodes);

    return res;
  }

  /**
   * Init project fields map from array obtained via gql.
   * @param fields
   * @returns
   */
  private initFields(fields: ProjectFieldEntry[]): void {
    for (const entry of fields) {
      if (entry.id === undefined) {
        return;
      }
      this.fields[entry.name] = entry;
    }
  }

  public async addToProject(
    itemID: string,
    isPullRequest: boolean,
  ): Promise<void> {
    core.debug(`addToProject item ID ${itemID}`);

    if (this.projectID === undefined) {
      throw new Error("Expected Project ID to be populated!");
    }

    const item = await getProjectItem(this.octokit, itemID, this.projectID);
    if (item === undefined) {
      core.info(`Adding item '${itemID}' to project '${this.projectID}'`);
      addProjectItem(this.octokit, itemID, this.projectID);
    } else {
      core.info(`Item already associated with project '${this.projectID}`);
    }

    const newStatus = isPullRequest
      ? this.defaultStatus.prs
      : this.defaultStatus.issues;
    core.info(`Set status to '${newStatus}`);
  }
}

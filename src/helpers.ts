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
import { GitHub } from "@actions/github/lib/utils";
import {
  AddToProjectResponse,
  NodeProjectItemsEntry,
  NodeProjectItemsResponse,
  UpdateIssueStatusResponse,
} from "./gql-types";

// So we can make typing of 'github.getOctokit()' work.
export type Octokit = InstanceType<typeof GitHub>;

// for getProjectItem
export type ProjectItemEntry = {
  prjItemID: string;
  project: {
    id: string;
    title: string;
  };
  status:
    | {
        name: string;
      }
    | undefined;
};

/**
 * Obtain project item, associated with a given project ID, from a provided item
 * ID.
 *
 * @param octokit
 * @param itemID
 * @param projectID
 * @returns
 */
export async function getProjectItem(
  octokit: Octokit,
  itemID: string,
  projectID: string,
): Promise<ProjectItemEntry | undefined> {
  const res = await octokit.graphql<NodeProjectItemsResponse>(
    `#graphql
    fragment projectItemData on ProjectV2Item {
      id
      project {
        id
        title
      }
      fieldValueByName(name: "Status") {
        ... on ProjectV2ItemFieldSingleSelectValue {
          name
        }
      }
    }

    query getProjectItem($itemID: ID!) {
      node(id: $itemID) {
        ... on Issue {
          projectItems(first: 20) {
            nodes {
              ...projectItemData
            }
          }
        }
        ... on PullRequest {
          projectItems(first: 20) {
            nodes {
              ...projectItemData
            }
          }
        }
      }
    }
    `,
    {
      itemID,
    },
  );

  if (res.node.projectItems.nodes.length === 0) {
    core.debug(`item ${itemID} not associated with projects`);
    return undefined;
  }

  let prjEntry: NodeProjectItemsEntry | undefined = undefined;
  for (const entry of res.node.projectItems.nodes) {
    if (entry.project.id === projectID) {
      prjEntry = entry;
      break;
    }
  }

  if (prjEntry === undefined) {
    core.debug(`item ${itemID} not associated with project ${projectID}`);
    return undefined;
  }

  const prjItem: ProjectItemEntry = {
    prjItemID: prjEntry.id,
    project: {
      id: prjEntry.project.id,
      title: prjEntry.project.title,
    },
    status:
      prjEntry.fieldValueByName !== null
        ? prjEntry.fieldValueByName
        : undefined,
  };

  core.debug(
    `item ${itemID} project item ${prjItem.prjItemID}, status: ${prjItem.status}`,
  );

  return prjItem;
}

// for addToProject

/**
 * Add a given item ID to the specified project ID.
 *
 * @param octokit
 * @param itemID
 * @param projectID
 * @returns
 */
export async function addProjectItem(
  octokit: Octokit,
  itemID: string,
  projectID: string,
): Promise<string> {
  const res = await octokit.graphql<AddToProjectResponse>(
    `#graphql
    mutation addToProject($projectID: ID!, $itemID: ID!) {
      addProjectV2ItemById(input: {
        projectId: $projectID,
        contentId: $itemID
      }) {
        item {
          id
        }
      }
    }
    `,
    {
      projectID,
      itemID,
    },
  );

  return res.addProjectV2ItemById.item.id;
}

// for updateIssueStatus

export async function updateIssueStatus(
  octokit: Octokit,
  projectID: string,
  projectItemID: string,
  projectStatusFieldID: string,
  projectStatusValueID: string,
): Promise<void> {
  const res = await octokit.graphql<UpdateIssueStatusResponse>(
    `#graphql
    mutation updateIssueStatus($projectID: ID!, $itemID: ID!, $fieldID: ID!, $fieldValue: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectID,
        itemId: $itemID,
        fieldId: $fieldID,
        value: {
          singleSelectOptionId: $fieldValue
        }
      }) {
        projectV2Item {
          id
        }
      }
    }
    `,
    {
      projectID,
      itemID: projectItemID,
      fieldID: projectStatusFieldID,
      fieldValue: projectStatusValueID,
    },
  );

  const resID = res.updateProjectV2ItemFieldValue.projectV2Item.id;
  if (resID !== projectItemID) {
    throw new Error(
      `Project Item ID mismatch! Expected '${projectItemID}', got ${resID}`,
    );
  }
}

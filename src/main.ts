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

interface Config {
  projectURL: string;
  ghToken: string;
  defaultIssueStatus: string;
  defaultPRStatus: string;
}

type ProjectDesc = {
  owner: string;
  projectNumber: number;
  isOrg: boolean;
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

export async function main(): Promise<void> {
  const config: Config = {
    projectURL: core.getInput("project-url", { required: true }),
    ghToken: core.getInput("gh-token", { required: true }),
    defaultIssueStatus: core.getInput("default-issue-status", {
      required: true,
    }),
    defaultPRStatus: core.getInput("default-pr-status", { required: true }),
  };

  // validate config
  if (!config.ghToken.startsWith("ghp_")) {
    core.error("GitHub token must be a classic PAT, not fine-grained.");
    throw new Error("Invalid GitHub token");
  }

  // propagate exceptions
  const desc: ProjectDesc = parseURL(config.projectURL);
  core.debug(
    `Working with project '${desc.projectNumber}' from '${desc.owner}'`,
  );

  const payloadStr = JSON.stringify(github.context.payload, null, 2);
  core.debug(`payload: ${payloadStr}`);

  core.setOutput("project-item-id", 123);
  return;
}

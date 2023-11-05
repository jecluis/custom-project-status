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
import { Project } from "./project";

async function run_action(): Promise<void> {
  const projectURL: string = core.getInput("project-url", { required: true });
  const ghToken: string = core.getInput("gh-token", { required: true });
  const defaultIssueStatus: string = core.getInput("default-issue-status", {
    required: true,
  });
  const defaultPRStatus: string = core.getInput("default-pr-status", {
    required: true,
  });

  // validate config
  if (ghToken === "") {
    core.error("GitHub token must be defined");
    throw new Error("Invalid GitHub token");
  }

  const project = new Project(ghToken, projectURL, {
    issues: defaultIssueStatus,
    prs: defaultPRStatus,
  });

  const projectDesc = await project.init();
  core.debug(`using project ${projectDesc.title} id ${projectDesc.id}`);

  const payloadStr = JSON.stringify(github.context.payload, null, 2);
  core.debug(`payload: ${payloadStr}`);

  const payload = github.context.payload;

  let payloadNodeID: string | undefined = undefined;
  let isPullRequest = false;
  if (payload.issue !== undefined && payload.issue !== null) {
    payloadNodeID = payload.issue.node_id;
  } else if (
    payload.pull_request !== undefined &&
    payload.pull_request !== null
  ) {
    payloadNodeID = payload.pull_request.node_id;
    isPullRequest = true;
  } else {
    // not our payload, exit.
    core.error(`Unable to obtain PR or Issue payload from ${payloadStr}`);
    return;
  }

  if (payloadNodeID === undefined) {
    throw new Error("Unexpected undefined payload node ID!");
  }

  const prjItemID = await project.addToProject(payloadNodeID, isPullRequest);

  core.setOutput("project-item-id", prjItemID);
  return;
}

export async function main(): Promise<void> {
  try {
    await run_action();
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    core.setFailed(message);
  }
}

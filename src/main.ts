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

export async function main(): Promise<void> {
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

  core.setOutput("project-item-id", 123);
  return;
}

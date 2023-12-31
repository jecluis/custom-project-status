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

// types from gh gql
export type IDTitleEntry = { id: string; title: string };

export type ProjectFieldEntry = {
  id: string;
  name: string;
  options: {
    id: string;
    name: string;
  }[];
};

export type ProjectV2Entry = IDTitleEntry & {
  fields: { nodes: ProjectFieldEntry[] };
};

export type ProjectQueryResponse = {
  organization:
    | {
        projectV2: ProjectV2Entry;
      }
    | undefined;
  user:
    | {
        projectV2: ProjectV2Entry;
      }
    | undefined;
};

// --- for 'getNodeProjectItems' query ---
//
export type NodeProjectItemsEntry = {
  id: string;
  project: IDTitleEntry;
  fieldValueByName: { name: string } | null;
};

export type NodeProjectItemsResponse = {
  node: {
    projectItems: {
      nodes: NodeProjectItemsEntry[];
    };
  };
};
// --- 8< ---

// --- for 'addToProject' mutation ---
export type AddToProjectResponse = {
  addProjectV2ItemById: {
    item: {
      id: string;
    };
  };
};
// --- 8< ---

// --- for 'updateIssueStatus' mutation ---
export type UpdateIssueStatusResponse = {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string;
    };
  };
};
// --- 8< ---

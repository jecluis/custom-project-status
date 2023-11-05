# Custom Project Status action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This action will add a newly opened issue or pull request to a specified
project, setting its `Status` field to a predefined value.

## Configuration

```yaml
name: Add issue or pull request to project

on:
  issues:
    types:
      - opened
  pull_request:
    types:
      - opened

jobs:
  add-to-project:
    name: Add issue/pr to project
    runs-on: ubuntu-latest
    steps:
      - uses: jecluis/custom-project-status@main
        with:
          project-url: https://github.com/users/jecluis/projects/4/views/1
          gh-token: ${{ secrets.PAT_PROJECTS }}
          default-issue-status: "New"
          default-pr-status: "In review"
```

### Accepted Inputs

- **project-url:** The URL for the project to which we will be adding items
- **gh-token:** A Personal Access Token (classic) with `projects` permission.
- **default-issue-status:** The name of the status to add an _issue_ to. This
  can be a substring of the actual status value.
- **default-pr-status:** The name of the status to add a _pull request_ to. This
  can be a substring of the actual status value.

### Output

- **project-item-id:** The Project Item ID for the item that has been added.

## LICENSE

```text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

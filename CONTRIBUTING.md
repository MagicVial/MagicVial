# Contributing to MagicVial

First off, thank you for considering contributing to MagicVial! It's people like you that make MagicVial such a great tool.

## Code of Conduct

The MagicVial project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to info@magicvial.co.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for MagicVial. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

Before creating bug reports, please check the issue tracker as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible.

#### How Do I Submit A Good Bug Report?

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title for the issue to identify the problem.
* Describe the exact steps which reproduce the problem in as many details as possible.
* Provide specific examples to demonstrate the steps.
* Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
* Explain which behavior you expected to see instead and why.
* Include screenshots and animated GIFs which show you following the described steps and clearly demonstrate the problem.
* If the problem wasn't triggered by a specific action, describe what you were doing before the problem happened.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for MagicVial, including completely new features and minor improvements to existing functionality.

#### How Do I Submit A Good Enhancement Suggestion?

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title for the issue to identify the suggestion.
* Provide a step-by-step description of the suggested enhancement in as many details as possible.
* Provide specific examples to demonstrate the steps.
* Describe the current behavior and explain which behavior you expected to see instead and why.
* Include screenshots and animated GIFs which help you demonstrate the steps or point out the part of MagicVial which the suggestion is related to.
* Explain why this enhancement would be useful to most MagicVial users.
* List some other applications where this enhancement exists.

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the style guides
* End all files with a newline
* Avoid platform-dependent code
* Place requires in the following order:
  * Built in Node Modules (such as path)
  * External Modules (such as axios)
  * Internal Modules (using relative paths)

## Style Guides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
  * 🎨 `:art:` when improving the format/structure of the code
  * 🐎 `:racehorse:` when improving performance
  * 🔒 `:lock:` when dealing with security
  * 📝 `:memo:` when writing docs
  * 🐛 `:bug:` when fixing a bug
  * 🔥 `:fire:` when removing code or files
  * 💚 `:green_heart:` when fixing the CI build
  * ✅ `:white_check_mark:` when adding tests
  * 🚀 `:rocket:` when deploying stuff

### JavaScript Styleguide

All JavaScript code is linted with ESLint and formatted with Prettier.

### Solidity Styleguide

All Solidity code should follow the official Solidity style guide.

### Documentation Styleguide

* Use Markdown.
* Reference methods and classes in markdown with the custom `{@link}` syntax.

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

#### Type of Issue and Issue State

* `enhancement`: Feature requests.
* `bug`: Confirmed bugs or reports that are very likely to be bugs.
* `question`: Questions more than bug reports or feature requests (e.g. how do I do X).
* `feedback`: General feedback more than bug reports or feature requests.

#### Topic Categories

* `frontend`: Related to the frontend.
* `backend`: Related to the backend.
* `smart-contract`: Related to the smart contracts.
* `documentation`: Related to any type of documentation.

#### Pull Request Labels

* `work-in-progress`: Pull requests which are still being worked on, more changes will follow.
* `needs-review`: Pull requests which need code review, and approval from maintainers or MagicVial core team.
* `under-review`: Pull requests being reviewed by maintainers or MagicVial core team.
* `requires-changes`: Pull requests which need to be updated based on review comments and then reviewed again.
* `needs-testing`: Pull requests which need manual testing.

Thank you for contributing to MagicVial! Happy crafting! ✨ 
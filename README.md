# Git Message Generator

AI-powered commit message generator for VS Code with custom prompts and multi-model support.

## Features

- 🤖 **Multi-Model Support**: OpenAI, Claude, Gemini, and custom OpenAI-compatible APIs
- 📝 **Custom Prompts**: Fully customizable prompt templates
- 📋 **Commitlint Integration**: Auto-adapts to your project's commitlint rules
- 🌍 **Multi-language**: Generate messages in English, Chinese, Japanese, Korean
- ⚡ **One-Click Generation**: Button in Source Control panel
- ⌨️ **Streaming Output**: Writes into SCM input box as tokens arrive (if endpoint supports SSE)

## Usage

1. Stage your changes in Git
2. Click the ✨ button in the Source Control panel
3. Commit message is automatically generated and filled in

## Configuration

### Settings

- `gitMessage.custom.baseUrl`: Custom OpenAI-compatible endpoint base URL (required)
- `gitMessage.custom.model`: Model name (required)
- `gitMessage.custom.apiKey`: API key (required)
- `gitMessage.language`: Output language (en/zh-CN/zh-TW/ja/ko)
- `gitMessage.customPrompt`: Custom prompt template
- `gitMessage.enableHeuristics`: Suggest `type`/`scope` from staged file paths
- `gitMessage.smartDiffTrim`: Prefer semantic diff trimming when large
- `gitMessage.outputStyle`: `headerOnly` (single line) or `headerAndBody` (multi-line)
- `gitMessage.debug`: Enable debug logging (Output: "Git Message Generator")
- `gitMessage.debugLogPrompt`: Log full prompt content (may include sensitive code)

### Prompt Variables

| Variable | Description |
|----------|-------------|
| `{{diff}}` | Git staged diff |
| `{{files}}` | List of changed files |
| `{{branch}}` | Current branch name |
| `{{commitlint_rules}}` | Parsed commitlint rules |
| `{{language}}` | Target language |

## License

MIT

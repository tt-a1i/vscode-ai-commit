# Git Message Generator

AI-powered commit message generator for VS Code with custom prompts and multi-model support.

## Features

- 🤖 **Multi-Model Support**: OpenAI, Claude, Gemini, and custom OpenAI-compatible APIs
- 📝 **Custom Prompts**: Fully customizable prompt templates
- 📋 **Commitlint Integration**: Auto-adapts to your project's commitlint rules
- 🌍 **Multi-language**: Generate messages in English, Chinese, Japanese, Korean
- ⚡ **One-Click Generation**: Button in Source Control panel

## Usage

1. Stage your changes in Git
2. Click the ✨ button in the Source Control panel
3. Commit message is automatically generated and filled in

## Configuration

### Set API Key

Run command: `Git Message: Set API Key`

### Settings

- `gitMessage.defaultProvider`: Choose AI provider (openai/claude/gemini/custom)
- `gitMessage.language`: Output language (en/zh-CN/zh-TW/ja/ko)
- `gitMessage.customPrompt`: Custom prompt template

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

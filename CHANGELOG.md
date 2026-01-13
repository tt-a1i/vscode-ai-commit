# Changelog

All notable changes to the "Git Message Generator" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-12

### Added

- **Multi-model AI support**: OpenAI, Claude, Gemini, and Custom OpenAI-compatible APIs
- **One-click generation**: Button in Source Control panel (✨ icon)
- **Conventional Commits**: Auto-generate messages following the convention
- **Commitlint integration**: Automatically adapts to project `.commitlintrc` rules
- **Multi-language output**: English, 简体中文, 繁體中文, 日本語, 한국어
- **Custom prompts**: Full template customization with variables
- **Secure API key storage**: Uses VS Code SecretStorage
- **Cancellable requests**: Abort generation at any time
- **Smart error handling**: Retry, switch provider, or set API key on failure
- **Debug logging**: Optional detailed logs in Output channel
- **Multi-repo support**: Automatically detects active repository

### Commands

- `Git Message: Generate Commit Message` - Generate and fill commit message
- `Git Message: Set API Key` - Configure API key for providers
- `Git Message: Switch AI Provider` - Change default AI provider
- `Git Message: Switch Language` - Change output language

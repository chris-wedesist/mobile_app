<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Desist Mobile Security Library Instructions

This is a comprehensive mobile security library written in TypeScript. The library provides:

1. **Encryption Services** - AES encryption, hashing, key management
2. **Authentication** - JWT tokens, biometric authentication, multi-factor auth
3. **Secure Storage** - Encrypted local storage with key rotation
4. **Network Security** - SSL pinning, request/response validation
5. **Threat Detection** - Runtime application self-protection (RASP)
6. **Privacy Protection** - Data anonymization and consent management

## Code Style Guidelines:
- Use TypeScript with strict typing
- Follow clean architecture principles
- Implement comprehensive error handling
- Include JSDoc comments for all public methods
- Use dependency injection for testability
- Follow OWASP mobile security guidelines

## Security Considerations:
- Never log sensitive data
- Use secure random number generation
- Implement proper key management
- Follow principle of least privilege
- Validate all inputs and sanitize outputs
- Use timing-attack resistant comparisons

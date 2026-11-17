// Ainvil accepts AINVIL_* environment variables while the code still reads the upstream OPENCODE_* names.
// Each AINVIL_X is mirrored onto OPENCODE_X once at startup, so the new name wins and the old one keeps working.
// This must be imported before any module that reads the environment at import time.
Object.entries(process.env)
  .filter(([key, value]) => key.startsWith("AINVIL_") && value !== undefined)
  .forEach(([key, value]) => {
    process.env[`OPENCODE_${key.slice("AINVIL_".length)}`] = value
  })

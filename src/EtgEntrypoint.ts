const rawArgs = process.env.CLAVA_WRAPPER_ARGS;
const args = rawArgs ? JSON.parse(rawArgs) : [];

console.log('Received custom arguments:', args);
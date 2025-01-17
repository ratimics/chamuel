# Run tests if they exist (currently none configured)
npm run test || echo "No tests configured yet"

# Since there are no explicit linting/formatting commands in package.json,
# we should recommend adding them
echo "WARNING: Consider adding ESLint and Prettier for code quality checks:"
echo "npm install --save-dev eslint prettier"
echo "Add lint/format scripts to package.json"
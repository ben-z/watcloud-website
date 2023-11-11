module.exports = {
  "extends": [
    "next/core-web-vitals",
    "prettier",
    "plugin:mdx/recommended",
    "plugin:react/recommended"
  ],
  "ignorePatterns": [
    // imported components from shadcn
    "/components/ui/**",
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/no-unknown-property": [
      2,
      {
        "ignore": [
          // Allows for <style jsx>
          "jsx"
        ]
      }
    ],
  }
}

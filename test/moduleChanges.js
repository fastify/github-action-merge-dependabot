'use strict'

const { getModuleVersionChanges } = require('../src/moduleVersionChanges')

const rawDiffs = {
  patch: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^17.0.3",
`,
  prePatch: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2-foo",
+        "react": "^17.0.3",
`,
  preMajor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^18.0.0-pre",
`,
  preMinor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2-foo",
+        "react": "^17.1.0",
`,
  minor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^17.1.3",
`,
  major: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^18.0.0",
`,
  preReleaseUpgrade: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2-alpha",
+        "react": "^17.0.3-beta",
`,
  preReleaseToPathUpgrade: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2-alpha",
+        "react": "^17.0.3",
`,
  sameVersion: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^17.0.2",
`,
  commitHash: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "dotbot": "aa93350",
+        "dotbot": "ac5793c",
`,
  thisModuleAdded: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
+        "github-action-merge-dependabot": "1.4.0",
`,
  multiplePackagesMajorMinor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^18.0.0",
-        "react-dom": "^17.0.2",
+        "react-dom": "^17.0.3",
`,
  multipleFilesDiff: `
diff --git a/package-lock.json b/package-lock.json
index 8115dd8..4a3d4d7 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -12,9 +12,9 @@
                 "next": "^12.1.2",
                 "next-compose-plugins": "^2.2.1",
                 "phosphor-react": "^1.4.1",
-                "react": "^17.0.2",
+                "react": "^18.0.0",
                 "react-bootstrap": "^2.2.2",
-                "react-dom": "^17.0.2",
+                "react-dom": "^17.0.3",
                 "sharp": "^0.30.3"
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "react": "^17.0.2",
+        "react": "^18.0.0",
-        "react-dom": "^17.0.2",
+        "react-dom": "^17.0.3",
`,
  thisModuleMinor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "github-action-merge-dependabot": "1.2.3",
+        "github-action-merge-dependabot": "1.4.0",
`,
  thisModuleMajor: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "github-action-merge-dependabot": "1.2.3",
+        "github-action-merge-dependabot": "2.1.0",
`,
  thisModuleInvalidVersion: `
diff --git a/package.json b/package.json
index d3dfd3d..bd28161 100644
--- a/package.json
+++ b/package.json
@@ -19,9 +19,9 @@
-        "github-action-merge-dependabot": "",
+        "github-action-merge-dependabot": "",
`,
  noPackageJsonChanges: `
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index e790278..678e751 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -4,7 +4,7 @@ jobs:
   build:
     runs-on: ubuntu-latest
     steps:
-      - uses: actions/checkout@v2
+      - uses: actions/checkout@v3
       - uses: actions/setup-node@v3
         with:
           node-version-file: '.nvmrc'
`
}

const moduleChanges = {}

for (const scenario in rawDiffs) {
  moduleChanges[scenario] = getModuleVersionChanges(rawDiffs[scenario])
}

module.exports = {
  diffs: rawDiffs,
  moduleChanges,
}

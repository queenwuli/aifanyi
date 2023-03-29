/**
 * 打包所有食谱
 */
const targz = require('targz');
const fs = require('fs-extra');
const path = require('path');
const sizeOf = require('image-size');
const simpleGit = require('simple-git');
const pkgVersionChangedMatcher = new RegExp(/\n\+.*version.*/);

// 指向此存储库配方文件夹的公开可用链接
// 用于生成公共图标URL
// const repo = 'https://cdn.jsdelivr.net/gh/ferdium/ferdium-recipes/recipes/';

const repo = '../recipes/recipes/';

// 助手：将src文件夹压缩到dest文件
const compress = (src, dest) =>
  new Promise((resolve, reject) => {
    targz.compress(
      {
        src,
        dest,
        tar: {
          // 不打包.DS_Store文件和.md文件
          ignore: function (name) {
            return path.basename(name) === '.DS_Store' || name.endsWith('.md');
          },
        },
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve(dest);
        }
      },
    );
  });

// 让我们在异步环境中工作
(async () => {
  // 创建重要文件的路径
  const repoRoot = path.join(__dirname, '..');
  const recipesFolder = path.join(repoRoot, 'recipes');
  const outputFolder = path.join(repoRoot, 'archives');
  const allJson = path.join(repoRoot, 'all.json');
  const featuredFile = path.join(repoRoot, 'featured.json');
  const featuredRecipes = await fs.readJSON(featuredFile);
  let recipeList = [];
  let unsuccessful = 0;

  await fs.ensureDir(outputFolder);
  await fs.emptyDir(outputFolder);
  await fs.remove(allJson);

  const git = await simpleGit(repoRoot);
  const isGitRepo = await git.checkIsRepo();
  if (!isGitRepo) {
    console.debug('NOT A git repo: will bypass dirty state checks');
  }

  const availableRecipes = fs
    .readdirSync(recipesFolder, { withFileTypes: true })
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name);

  for (let recipe of availableRecipes) {
    const recipeSrc = path.join(recipesFolder, recipe);
    const packageJson = path.join(recipeSrc, 'package.json');

    // 检查该包。json存在
    if (!(await fs.pathExists(packageJson))) {
      console.log(
        `⚠️ Couldn't package "${recipe}": Folder doesn't contain a "package.json".`,
      );
      unsuccessful++;
      continue;
    }

    // 检查图标是否存在
    const svgIcon = path.join(recipeSrc, 'icon.svg');
    const hasSvg = await fs.pathExists(svgIcon);
    if (!hasSvg) {
      console.log(
        `⚠️ Couldn't package "${recipe}": Recipe doesn't contain an icon SVG`,
      );
      unsuccessful++;
      continue;
    }

    // 检查图标大小
    const svgSize = sizeOf(svgIcon);
    const svgHasRightSize = svgSize.width === svgSize.height;
    if (!svgHasRightSize) {
      console.log(
        `⚠️ Couldn't package "${recipe}": Recipe SVG icon isn't a square`,
      );
      unsuccessful++;
      continue;
    }

    // 检查该用户。js不存在
    const userJs = path.join(recipeSrc, 'user.js');
    if (await fs.pathExists(userJs)) {
      console.log(
        `⚠️ Couldn't package "${recipe}": Folder contains a "user.js".`,
      );
      unsuccessful++;
      continue;
    }

    // Read package.json
    const config = await fs.readJson(packageJson);

    // 确保它包含所有必填字段
    if (!config) {
      console.log(
        `⚠️ Couldn't package "${recipe}": Could not read or parse "package.json"`,
      );
      unsuccessful++;
      continue;
    }
    let configErrors = [];
    if (!config.id) {
      configErrors.push(
        "The recipe's package.json contains no 'id' field. This field should contain a unique ID made of lowercase letters (a-z), numbers (0-9), hyphens (-), periods (.), and underscores (_)",
      );
      // eslint-disable-next-line no-useless-escape
    } else if (!/^[\w.\-]+$/.test(config.id)) {
      configErrors.push(
        "The recipe's package.json defines an invalid recipe ID. Please make sure the 'id' field only contains lowercase letters (a-z), numbers (0-9), hyphens (-), periods (.), and underscores (_)",
      );
    }
    if (config.id !== recipe) {
      configErrors.push(
        `The recipe's id (${config.id}) does not match the folder name (${recipe})`,
      );
    }
    if (!config.name) {
      configErrors.push(
        "The recipe's package.json contains no 'name' field. This field should contain the name of the service (e.g. 'Google Keep')",
      );
    }
    if (!config.version) {
      configErrors.push(
        "The recipe's package.json contains no 'version' field. This field should contain the a semver-compatible version number for your recipe (e.g. '1.0.0')",
      );
    }
    if (!config.config || typeof config.config !== 'object') {
      configErrors.push(
        "The recipe's package.json contains no 'config' object. This field should contain a configuration for your service.",
      );
    }

    const topLevelKeys = Object.keys(config);
    for (const key of topLevelKeys) {
      if (typeof config[key] === 'string') {
        if (config[key] === '') {
          configErrors.push(
            `The recipe's package.json contains empty value for key: ${key}`,
          );
        }
      } else if (
        (key === 'config' || key === 'aliases') &&
        typeof config[key] !== 'object'
      ) {
        configErrors.push(
          `The recipe's package.json contains unexpected value for key: ${key}`,
        );
      }
    }

    const knownTopLevelKeys = new Set([
      'id',
      'name',
      'version',
      'license',
      'repository',
      'aliases',
      'config',
    ]);
    const unrecognizedKeys = topLevelKeys.filter(
      x => !knownTopLevelKeys.has(x),
    );
    if (unrecognizedKeys.length > 0) {
      configErrors.push(
        `The recipe's package.json contains the following keys that are not recognized: ${unrecognizedKeys}`,
      );
    }
    if (config.config && typeof config.config === 'object') {
      const configKeys = Object.keys(config.config);
      const knownConfigKeys = new Set([
        'serviceURL',
        'hasTeamId',
        'urlInputPrefix',
        'urlInputSuffix',
        'hasHostedOption',
        'hasCustomUrl',
        'hasNotificationSound',
        'hasDirectMessages',
        'hasIndirectMessages',
        'allowFavoritesDelineationInUnreadCount',
        'message',
        'disablewebsecurity',
      ]);
      const unrecognizedConfigKeys = configKeys.filter(
        x => !knownConfigKeys.has(x),
      );
      if (unrecognizedConfigKeys.length > 0) {
        configErrors.push(
          `The recipe's package.json contains the following keys that are not recognized: ${unrecognizedConfigKeys}`,
        );
      }

      // if (config.config.hasCustomUrl !== undefined && config.config.hasHostedOption !== undefined) {
      //   configErrors.push("The recipe's package.json contains both 'hasCustomUrl' and 'hasHostedOption'. Please remove 'hasCustomUrl' since it is overridden by 'hasHostedOption'");
      // }

      for (const key of configKeys) {
        if (
          typeof config.config[key] === 'string' &&
          config.config[key] === ''
        ) {
          configErrors.push(
            `The recipe's package.json contains empty value for key: ${key}`,
          );
        }
      }
    }

    if (isGitRepo) {
      const relativeRepoSrc = path.relative(repoRoot, recipeSrc);

      // Check for changes in recipe's directory, and if changes are present, then the changes should contain a version bump
      await git.diffSummary(relativeRepoSrc, (err, result) => {
        if (err) {
          configErrors.push(
            `Got the following error while checking for git changes: ${err}`,
          );
        } else if (
          result &&
          (result.changed !== 0 ||
            result.insertions !== 0 ||
            result.deletions !== 0)
        ) {
          const pkgJsonRelative = path.relative(repoRoot, packageJson);
          if (!result.files.some(({ file }) => file === pkgJsonRelative)) {
            configErrors.push(
              `Found changes in '${relativeRepoSrc}' without the corresponding version bump in '${pkgJsonRelative}'`,
            );
          } else {
            git.diff(pkgJsonRelative, (_diffErr, diffResult) => {
              if (diffResult && !pkgVersionChangedMatcher.test(diffResult)) {
                configErrors.push(
                  `Found changes in '${relativeRepoSrc}' without the corresponding version bump in '${pkgJsonRelative}' (found other changes though)`,
                );
              }
            });
          }
        }
      });
    }

    if (configErrors.length > 0) {
      console.log(`⚠️ Couldn't package "${recipe}": There were errors in the recipe's package.json:
  ${configErrors.reduce((str, err) => `${str}\n${err}`)}`);
      unsuccessful++;
    }

    if (!fs.existsSync(path.join(recipeSrc, 'index.js'))) {
      console.log(
        `⚠️ Couldn't package "${recipe}": The recipe doesn't contain a "index.js"`,
      );
      unsuccessful++;
    }

    // Package to .tar.gz
    compress(recipeSrc, path.join(outputFolder, `${config.id}.tar.gz`));

    // Add recipe to all.json
    const isFeatured = featuredRecipes.includes(config.id);
    const packageInfo = {
      featured: isFeatured,
      id: config.id,
      name: config.name,
      version: config.version,
      aliases: config.aliases,
      icons: {
        svg: `${repo}${config.id}/icon.svg`,
      },
    };
    recipeList.push(packageInfo);
  }

  // Sort package list alphabetically
  recipeList = recipeList.sort((a, b) => {
    var textA = a.id.toLowerCase();
    var textB = b.id.toLowerCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  });
  await fs.writeJson(allJson, recipeList, {
    spaces: 2,
    EOL: '\n',
  });

  console.log(
    `✅ Successfully packaged and added ${recipeList.length} recipes (${unsuccessful} unsuccessful recipes)`,
  );

  if (unsuccessful > 0) {
    throw new Error(`One or more recipes couldn't be packaged.`);
  }
})();

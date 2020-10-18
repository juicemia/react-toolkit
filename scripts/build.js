import { configFactory } from "../config/webpack.config";
import webpack from "webpack";
import chalk from "chalk";

// Default to production by default just in case.
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
}

if (!process.env.BABEL_ENV) {
    process.env.BABEL_ENV = process.env.NODE_ENV;
}

console.log("Building for " + chalk.green(process.env.NODE_ENV) + "...");
console.log();

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
    throw err;
});

const config = configFactory(process.env.NODE_ENV);

build(config)
    .then(({ stats, warnings }) => {
        if (warnings.length) {
            console.log(chalk.yellow("Compiled with warnings.\n"));
            console.log(warnings.join("\n\n"));
            console.log(
                "\nSearch for the " +
                    chalk.underline(chalk.yellow("keywords")) +
                    " to learn more about each warning."
            );
            console.log(
                "To ignore, add " +
                    chalk.cyan("// eslint-disable-next-line") +
                    " to the line before.\n"
            );
        } else {
            console.log(chalk.green("Compiled successfully.\n"));
        }
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err.message);
        }
        process.exit(1);
    });

function build(config) {
    return new Promise((resolve, reject) => {
        const compiler = webpack(config);
        compiler.run((err, stats) => {
            let messages;
            if (err) {
                if (!err.message) {
                    return reject(err);
                }

                let errMessage = err.message;

                messages = formatWebpackMessages({
                    errors: [errMessage],
                    warnings: [],
                });
            } else {
                messages = formatWebpackMessages(
                    stats.toJson({ all: false, warnings: true, errors: true })
                );
            }

            if (messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join("\n\n")));
            }

            if (
                process.env.CI &&
                (typeof process.env.CI !== "string" ||
                    process.env.CI.toLowerCase() !== "false") &&
                messages.warnings.length
            ) {
                console.log(
                    chalk.yellow(
                        "\nTreating warnings as errors because process.env.CI = true.\n" +
                            "Most CI servers set it automatically.\n"
                    )
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }

            return resolve({
                stats,
                warnings: messages.warnings,
            });
        });
    });
}

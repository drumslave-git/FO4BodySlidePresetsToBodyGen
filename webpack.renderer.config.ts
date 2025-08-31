import path from "node:path"
import type { Configuration } from "webpack"
import { plugins } from "./webpack.plugins"
import { rules } from "./webpack.rules"

rules.push({
	test: /\.css$/,
	use: [
		{ loader: "style-loader" },
		{ loader: "css-loader" },
		{ loader: "postcss-loader" },
	],
})

export const rendererConfig: Configuration = {
	module: {
		rules,
	},
	plugins,
	resolve: {
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
		alias: {
			three: path.resolve(__dirname, "node_modules/three"),
		},
	},
	experiments: {
		asyncWebAssembly: true, // allow wasm loading
	},
}

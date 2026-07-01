/** DISABLE_HMR：React Refresh 空实现 */

const noop = () => {};
const passthrough = (type) => type;

export function injectIntoGlobalHook() {}
export function register() {}
export function registerExportsForReactRefresh() {}
export function createSignatureFunctionForTransform() {
  return passthrough;
}
export function validateRefreshBoundaryAndEnqueueUpdate() {}
export const __hmr_import = (moduleUrl) => import(/* @vite-ignore */ moduleUrl);

export default { injectIntoGlobalHook };

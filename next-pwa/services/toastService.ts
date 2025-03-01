let toastRef: null | ((props: any) => void) = null;

/** Used by a React component to store the actual toast function reference. */
export function setToastRef(toastFn: (props: any) => void) {
  toastRef = toastFn;
}

/** Retrieve the current toast function. Could be null if not set yet. */
export function getToastRef() {
  return toastRef;
}

/** Convenient helper: call the stored toast function (if present). */
export function showToast(props: any) {
  if (toastRef) {
    toastRef(props);
  } else {
    console.warn("Toast reference not set yet. Did you mount the ToastServiceProvider?");
  }
}
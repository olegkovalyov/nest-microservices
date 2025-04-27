export function success(value) {
    return { success: true, value };
}
export function failure(error) {
    return { success: false, error };
}
export function hasError(result) {
    return !result.success;
}
export function value(result) {
    if (!result.success) {
        throw new Error(`Result is an error: ${result.error}`);
    }
    return result.value;
}
//# sourceMappingURL=result.js.map
const isEmpty = (object: Object) => {
    return Object.keys(object).length === 0;
}

const size = (object: Object) => {
    return Object.keys(object).length;
}

export {
    isEmpty,
    size
}
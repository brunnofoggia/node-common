
const throwHttpException = (message, httpStatus = 500) => {
    const error = new Error(message);
    error['status'] = httpStatus;
    throw error;
};

const exitRequest = (message, httpStatus = 200) => {
    const error = new Error(message);
    error['status'] = httpStatus;
    throw error;
};

export { throwHttpException, exitRequest };

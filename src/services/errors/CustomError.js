class CustomError {
    createError({name="Error", cause, message, code = 1 }){
        const error = new Error(message, {cause});
        error.name = name;
        error.code = code;
        throw error;
    }
}

module.exports = new CustomError();
import { ZodError } from 'zod';

/**
 * Validate an incoming requests body, query and params
 * against a given Zod schema and throws a 400 error response if validation fails.
 * @param schema Zod Schema to validate against
 * @returns express middleware function
 */
export const validate = (schema) => async (req, res, next) => {
    const { body, query, params, user } = req;

    try {
        await schema.parseAsync({ body, query, params, user });
        next();
    } catch (err) {
        if (err instanceof ZodError) {
            console.error(`Request for ${req.path} failed validation with:`, err);
            return res.status(400).send(err.issues);
        } else {
            console.error(`Error while validating request for ${req.path}:`, err);
            return res.status(500).send('Internal Server Error');
        }
    }
};

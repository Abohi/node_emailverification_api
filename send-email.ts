
const { v4: uuidv4}     = require('uuid');
const validator         = require('validator');
const bcrypt            = require('bcrypt');
const { Base64 }        = require('js-base64');

const domainName         = '';
const apiBaseUrl: string = `https://${domainName}:${process?.env?.PORT||5050}/api/`;

/**
 * Send email
 */
const EmailController = {
    /**
     * Send user activation email
     * @param string email
     */
    async sendActivation(userId: string, email: string) {
        try {
            // Activation key
            const activationKey     = uuidv4();
            const activationKeyHash = await bcrypt.hash(activationKey, 10);

            // TODO: send account activation email
            Base64.extendString();

            const encodeEmail          = Base64.encode(email);
            const encodeUserId         = Base64.encode(this.hashUserId(userId));
            const encodeToken          = Base64.encode(uuidv4());
            const encodeActivationKey  = Base64.encode(activationKey);

            const _encodeEmail         = Base64.fromUint8Array(Base64.toUint8Array(encodeEmail), true);
            const _encodeUserId        = Base64.fromUint8Array(Base64.toUint8Array(encodeUserId), true);
            const _encodeToken         = Base64.fromUint8Array(Base64.toUint8Array(encodeToken), true);
            const _encodeActivationKey = Base64.fromUint8Array(Base64.toUint8Array(encodeActivationKey), true);

            const activationUrlPath    = `user/activation/confirm/${_encodeUserId}/${_encodeEmail}/${_encodeActivationKey}/${_encodeToken}`;
            const activationUrl        = `${apiBaseUrl}${activationUrlPath}`;

            console.log(activationUrl);
            /**
             * Send email (nodemailer)
             */
            console.log(activationUrl);

            return {
                email,
                activationUrl,
                activationKeyHash
            };
        }
        catch (e) {
            console.log(e);
            throw 'Unable to send account activation email, please try again';
        }
    },

    hashUserId(userId: string): string {
        const randomChars  = uuidv4();
        const prefix       = randomChars.substr(0, 8);
        const suffix       = randomChars.substr(10, 20);
        const verbose      = randomChars.substr(22, 28);
        const userIdLen    = userId.length;
        const splitLen     = Math.floor((userIdLen / 2) - 7);
        const splitUserId  = userId.substr(0, splitLen);
        const splitUserId2 = userId.substr(splitLen);
        const _userId      = [prefix, splitUserId, verbose, splitUserId2, suffix].join('___');

        return _userId;
    },

    /**
     * Confirm user activation email
     * @param string email
     * @param string key
     */
    // async confirmActivation(args: { userId: string, email: string, key: string, token: string, response: Response }) {
    async confirmActivation(args) {
        const errorMsg = 'Email confirmation failed';
        try {
            const { userId, email, key, token, emailHash, response } = args;

            // Decode the base64 strings
            Base64.extendString();
            
            const decodeKey    = Base64.decode(key);
            const decodeUserId = Base64.decode(userId);
            const decodeEmail  = Base64.decode(email);
            const decodeToken  = Base64.decode(token);

            const _key        = validator.escape(decodeKey);
            const _token      = validator.escape(decodeToken);
            const _userId     = validator.escape(decodeUserId);
            const _email      = validator.normalizeEmail(decodeEmail);

            if (!Base64.isValid(_key) || !Base64.isValid(_userId) || !Base64.isValid(_token) || !validator.isEmail(_email)) {
                throw errorMsg;
            }

            // Get the user ID
            const splitUserId  = _userId.split('___');
            const splitUserId1 = (typeof splitUserId[1] !== 'undefined') ? splitUserId[1] : false; 
            const splitUserId2 = (typeof splitUserId[1] !== 'undefined') ? splitUserId[3] : false;

            if (!splitUserId1 || !splitUserId2) {
                throw 'Account activation not successful';
            }

            // Verify email hash
            const verifyEmailHash = await bcrypt.compare(_key, emailHash);
            if (!verifyEmailHash) {
                throw 'Activation key is invalid';
            }

            // Successful
            response.json({
                success: true,
                msg: 'Account activated successfully.',
                data: {
                    email: _email
                }
            });
        }
        catch (e) {
            console.log(e);
            throw errorMsg;
        }
    }
};

module.exports = EmailController;
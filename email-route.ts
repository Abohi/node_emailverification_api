import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const express         = require('express');
const bodyParser      = require('body-parser');
const EmailController = require('./send-email');

const firestore = admin.firestore();
const app       = express();

app.use(bodyParser.json());

/**
 * Confrim user email activation
 */
app.post('/api/user/account/confirm/:userId/:email/:key/:token', async (req, res) => {
    try {
        const { userId, email, key, token } = req.params;
        const activateUser = await EmailController.confirmActivation({
            userId, email, key, token,
            response: res
        });
        console.log(activateUser);
        
        const errorMsg = 'Account activation failed, please try again.';
        if (!activateUser) throw errorMsg;

        // update the user status and clear the user activation key
        let activationKeyPromise = firestore.collection("").doc(userId).set({
            "userStatus":"1",
            "activationKey": "",
        },{merge:true})

        return activationKeyPromise.then(activationWriteResult=>{
            res.send(activateUser);
        })
        .catch(e => {
            console.log(e);
            throw errorMsg;
        });
    }
    catch(e) {
        console.log(e);
        res.status(401).send({
            success: false,
            msg: (typeof e === 'string') ? e : 'Account activation failed, please try again'
        });
    }
});

exports.emailLink = functions.https.onRequest(app);
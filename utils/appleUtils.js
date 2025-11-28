const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Apple public keys
const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.verifyAppleIdentityToken = (identityToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(identityToken, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded); // decoded.sub is stable Apple userId
    });
  });
};

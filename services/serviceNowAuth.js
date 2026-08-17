const jwt = require('jsonwebtoken');

exports.verifyServiceNowToken = (req, res, next) => {
    const authHeader = req.headers['token'] || req.headers['authorization']; // support both 'token' and 'Authorization' headers

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing'
        });
    }

    // Expected: Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Invalid Authorization format'
        });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token expired or invalid'
            });
        }

        req.serviceNowUser = decoded; // attach decoded payload
        next();
    });
};

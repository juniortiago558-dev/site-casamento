const jwt = require("jsonwebtoken");

module.exports = function(req,res,next){

    const header =
    req.headers.authorization;

    if(!header){

        return res.status(401).json({
            erro:"Token não informado"
        });
    }

    const token =
    header.replace(
        "Bearer ",
        ""
    );

    try{

        const usuario =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario =
        usuario;

        next();

    }
    catch{

        return res.status(401).json({
            erro:"Token inválido"
        });
    }
};
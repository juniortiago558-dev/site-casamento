module.exports = function(req,res,next){

    if(
        req.usuario.perfil !==
        "ADM"
    ){

        return res.status(403).json({
            erro:"Acesso negado"
        });

    }

    next();
};
module.exports = function(fn){
		function retryer(){
			return fn().catch((err) => {
				if(err.errcode === 'M_LIMIT_EXCEEDED'){
					//err.data.retry_after_me+
					return new Promise((resolve) => setTimeout(resolve, 1000)).then(retryer);
				}
			});
		}
		return retryer();
};

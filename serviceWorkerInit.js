if(navigator.serviceWorker) {
	navigator
		.serviceWorker
		.register('sw.js')
		.then(function(r) {
			console.log('Models are now available offline');
		})
		.catch(function(e) {
			console.log('Models are NOT available offline');
			console.log(e);
		});
} else {
	console.log('Service workers are not supported');
}

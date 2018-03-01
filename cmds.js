const {log, biglog, errorlog, colorize} = require ("./out");
const model = require ("./model");

exports.helpCmd = rl => {
	log(" Commandos:");
    log("\th|help - Muestra esta ayuda.");
 	log("\tlist - Listar los quizzes existentes.");
 	log("\tshow <id> - Muestra la pregunta y la respuesta el quiz indicado.");
 	log("\tadd - Añadir un nuevo quiz interactivamente.");
 	log("\tdelete <id> - Borrar el quiz indicado.");
 	log("\tedit <id> - Editar el quiz indicado.");
 	log("\ttest <id> - Probar el quiz indicado.");
 	log("\tp|play - Jugar a preguntar aleatoriamente todos los quizzes.");
 	log("\tcredits - Créditos.");
	log("\tq|quit - Salir del programa.");
	rl.prompt();
};
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();

};
exports.showCmd = (rl,id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} 
	else {
		try{
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
		}
		catch(error){
			errorlog(error.message);
		}
	}
	rl.prompt();

};
exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`)
			rl.prompt();
		});
	});
};
exports.deleteCmd = (rl,id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} 
	else {
		try{
			model.deleteByIndex(id);
			
		}
		catch(error){
			errorlog(error.message);
		}
	}
	rl.prompt();

};
exports.editCmd = (rl,id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} 
	else {
		try{
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
				rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`)
					rl.prompt();
				});
			});
		}
		catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}

};
exports.testCmd = (rl,id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}
	else{
		try{ 
			const quiz = model.getByIndex(id);
			rl.question(` ${colorize(quiz.question, 'red')}${colorize('?', 'red')} `, respuesta =>{
				if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase()){
					blog('Correcta', 'green');
					rl.prompt();
				}
				else{
					log('Incorrecta', 'red');
					rl.prompt();
				}
			});
		}
		catch(error){ 
			errorlog(`El valor del parámetro id no es válido`);
			rl.prompt();
		}
	}
};
exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];

	model.getAll().forEach((quiz, id) => {
		toBeResolved.push(id);
	});

	const playOne = () => {
		if (toBeResolved.length === 0){
			log ('  No hay más que preguntar.');
			log ('  Fin del Examen. Aciertos:')
			biglog(score, 'magenta');
			rl.prompt();
		}
		else {
			let index = Math.floor(Math.random() * toBeResolved.length);
			let id = toBeResolved[index];
			toBeResolved.splice(index,1);
			let quiz =  model.getByIndex(id);
			rl.question(` ${colorize(quiz.question, 'red')}${colorize('?', 'red')} `, respuesta =>{
				if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase()){
					score = score + 1;
					log(`  CORRECTO - Llevas ${score} aciertos.`);
			 		playOne();
				}
				else{
					log("  INCORRECTO.");
					log ('  Fin del Examen. Aciertos:')
					biglog(score, 'magenta');
					rl.prompt();
					}
			});
		}
	}
	playOne();
};
exports.creditsCmd = rl => {
	log (" Autores de la práctica:", "green");
	log ("\tJorge Miguel Pérez Utrera", "green");
	log ("\tMarcos Sánchez Hernández", "green");
	rl.prompt();
};
exports.quitCmd = rl => {
	rl.close();
};
const Sequelize = require('sequelize')
const {log, biglog, errorlog, colorize} = require ("./out");
const {models} = require ("./model");

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

	models.quiz.findAll()
	.each(quiz => {
			log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question}`);
		})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	})
};

const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined"){
			reject(new Error(`Falta el parámetro <id>.`));
		}
		else {
			id = parseInt(id);
			if (Number.isNaN(id)){
				reject(new Error(`el valor del parámetro <id> no es un número.`));
			}
			else{
				resolve(id);
			}
		}
	});
};

exports.showCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error (`No existe un quiz asociado al id=${id}.`);
		}
		log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise ((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl => {
	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then (a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
exports.deleteCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
exports.editCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asoiado al id=${id}.`);
		}
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
exports.testCmd = (rl,id) => {
	validateId(id)
		.then(id => models.quiz.findById(id))
		.then(quiz => {
			if (!quiz){
				throw new Error(`No existe un quiz asoiado al id=${id}.`);
			}
			return makeQuestion(rl, `${quiz.question}? `)
			.then(a => {
				if(a.toLowerCase().trim() === quiz.answer.toLowerCase()){
					log('Correcta', 'green');
					rl.prompt();
				}
				else{
					log('Incorrecta', 'red');
					rl.prompt();
				}
			});
		})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

const playOne = (rl, toBeResolved, score) => {
		if (toBeResolved.length === 0){
			log ('No hay más que preguntar.');
			log ('Fin del Examen. Aciertos:')
			biglog(score, 'magenta');
			rl.prompt();
		}
		else {
			let index = Math.floor(Math.random() * toBeResolved.length);
			let id = toBeResolved[index];
			toBeResolved.splice(index,1);
			models.quiz.findById(id)
			.then(quiz => {
				rl.question(` ${colorize(quiz.question, 'red')}${colorize('?', 'red')} `, respuesta =>{
					if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase()){
						score = score + 1;
						log(`CORRECTO - Llevas ${score} aciertos.`);
				 		playOne(rl, toBeResolved, score);
					}
					else{
						log("INCORRECTO.");
						log ('Fin del Examen. Aciertos:')
						log(score, 'magenta');
						rl.prompt();
						}
				});
			});
		}
	}

exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];

	models.quiz.findAll()
		.each(quiz => {
				toBeResolved.push(quiz.id);
			})
		.then(() => {
			playOne(rl, toBeResolved, score)
		});

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
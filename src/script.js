//This is a pictionaly App that you can play with your friend. First, you enter your name on the left and save your name. If your friend come, you can write start drawing to start game. The timer will let you know how many seconds left for guessing. In the chat box, you can write your answerto let you know. You can save your own words to play game below.

//Player/chat box data collections will be shown when you add players name and messages. Those collections will be removed whenever you refresh the page.
//Database Address: https://pictionary-4358a.firebaseio.com

// Reference
//Friday Fun written by Jin Kuwata(https://codepen.io/jmk2142/pen/eYpvjXm?editors=1010)

let db = firebase.firestore();
let canvasRef = db.collection("canvas");
let playerRef = db.collection("players");
let messageRef = db.collection("messages");
let wordsRef = db.collection("words");
let eventBus = new Vue();

let points = [];

Vue.component("vue-canvas", {
	data() {
		return {
			canvas: {},
			ctx: {},
			rect: {},
			draw: false,
			clear: false,
			x: 0,
			y: 0,
			strokeColor: "#555555",
			lineWidth: 1,
			word: null,
			finalDoc: null
		};
	},
	methods: {
		onMousedown(e) {
			points = [];

			this.clear = false;
			this.draw = true;

			this.ctx.strokeStyle = this.strokeColor;
			this.ctx.lineWidth = this.lineWidth;

			this.x = e.pageX - this.rect.left;
			this.y = e.pageY - this.rect.top;

			this.ctx.beginPath();
			this.ctx.moveTo(this.x, this.y);

			canvasRef.doc("drawing").update({
				x: this.x,
				y: this.y,
				clear: false
			});
		},
		onMouseup(e) {
			this.draw = false;
		},
		onMousemove(e) {
			if (this.draw === false) {
				return null;
			} else {
				this.ctx.lineTo(e.pageX - this.rect.left, e.pageY - this.rect.top);
				this.ctx.stroke();

				//console.log(e.pageX, e.pageY);

				this.x = e.pageX - this.rect.left - 97.5 * 2;
				this.y = e.pageY - this.rect.top;
			}
			canvasRef.doc("drawing").update({
				x: this.x,
				y: this.y
			});
		},
		clearCanvas(e) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			eventBus.$emit("clearCanvas");
		},
		changeColor(e) {
			this.strokeColor = e.target.value;
		},
		changeLine(e) {
			this.lineWidth = e.target.value;
		}
	},
	template: `<div>
		<canvas
			ref="pictionaryBoard"
			width="600" height="300" 
			@mousedown="onMousedown"
			@mouseup="onMouseup"
			@mousemove="onMousemove"
            @mouseleave="onMouseup"
		></canvas>
		<button @click="clearCanvas">Clear</button>
		<br>
 		<button value ="#4CAF50" class="button" @click="changeColor($event)"></button>
 		<button value ="#008CBA" class="button button2" @click="changeColor($event)"></button>
 		<button value ="#f44336" class="button button3" @click="changeColor($event)"></button>
 		<button value ="#e7e7e7" class="button button4" @click="changeColor($event)"></button>
 		<button value ="#555555" class="button button5" @click="changeColor($event)"></button>
		<button value = 3 class="button10 button6" @click="changeLine($event)">3px</button>
		<button value = 10 class="button10 button6" @click="changeLine($event)">10px</button>
		<button value = 25 class="button10 button6" @click="changeLine($event)">25px</button>
		<button value = 40 class="button10 button6" @click="changeLine($event)">40px</button>
	</div>`,
	mounted() {
		this.canvas = this.$refs.pictionaryBoard;
		this.ctx = this.canvas.getContext("2d");
		this.rect = this.canvas.getBoundingClientRect();
	}
});

Vue.component("player", {
	props: ["player"],
	template: `
    <div class="playername">
		<p>{{ player.id }} <button @click = "removePlayer">Remove</button></p>
    <div/>
  `,
	methods: {
		removePlayer() {
			this.$emit("remove-player", this.player.id);
		}
	}
});

Vue.component("message", {
	props: ["message"],
	template: `
    <div>
		<p>{{ message.id }} : {{ message.message }}</p>
    </div>
  `
});

Vue.component("watch", {
	data() {
		return {
			canvas2: {},
			ctx2: {},
			rect2: {}
		};
	},
	template: `<div>
		<canvas
			ref="pictionaryBoard2"
			width="600" height="300" 
		></canvas>
	</div>`,
	mounted() {
		this.canvas2 = this.$refs.pictionaryBoard2;
		this.ctx2 = this.canvas2.getContext("2d");
		this.rect2 = this.canvas2.getBoundingClientRect();

		var points = [];

		canvasRef.doc("drawing").onSnapshot((doc) => {
			if (points.length < 2) {
				points.push(doc.data());
			} else {
				points.shift();
				points.push(doc.data());

				this.ctx2.strokeStyle = points[0].strokeColor;
				this.ctx2.lineWidth = points[0].lineWidth;
				this.ctx2.beginPath();
				this.ctx2.moveTo(points[0].x, points[0].y);
				this.ctx2.lineTo(points[1].x, points[1].y);
				this.ctx2.stroke();
			}
		});
	},
	created() {
		eventBus.$on("clearCanvas", () => {
			this.ctx2.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
		});
	}
});

var app = new Vue({
	el: "#app",
	data: {
		user: "",
		playername: "",
		chatname: "",
		players: [],
		message: "",
		messages: [],
		countDown: 3,
		timer: 60,
		isRunning: false,
		interval: null,
		host: false,
		newWord: "",
		words: [],
		word: "",
		finalDoc: ""
	},
	methods: {
		savePlayer() {
			playerRef.doc(this.playername).set({
				id: this.playername,
				score: 0,
				host: false
			});

			this.players.push(playerRef.doc(this.playername));
			alert("Your name is saved successfully!");
		},
		sendMessage() {
			var today = new Date();

			if (this.message !== "" && this.playername !== "") {
				if (this.message == this.word) {
					messageRef.add({
						id: this.playername,
						message: "You got the answer!",
						time: today
					});
				} else {
					messageRef.add({
						id: this.playername,
						message: this.message,
						time: today
					});
				}
			}

			this.message = "";
		},
		removePlayer(player) {
			playerRef.doc(player).delete();
		},
		removeAllPlayer() {
			playerRef.get().then((res) => {
				res.forEach((element) => {
					element.ref.delete();
				});
			});
		},
		deleteChat() {
			messageRef.get().then((res) => {
				res.forEach((element) => {
					element.ref.delete();
				});
			});
		},
		removeMessage(chat) {
			messageRef.doc(chat.id).delete();
		},

		toggleTimer() {
			this.timer = 60;
			//change host

			playerRef.onSnapshot(
				(querySnapshot) =>
					(this.players = querySnapshot.docs.map((doc) => doc.data()))
			);

			for (var i = 0; i < this.players.length; i++) {
				var playerId = this.players[i].id.toString();
				// var playerHost = this.players[i].host
				playerRef.doc(playerId).update({
					host: false
				});
				this.players[i].host = this.host;
				// console.log(this.host);
			}

			playerRef.doc(this.playername).update({
				host: true
			});
			this.host = !this.host;
			// console.log(this.host);

			//timer
			if (this.isRunning) {
				clearInterval(this.interval);
				// console.log("toggle the button");
			} else {
				this.interval = setInterval(this.decrementTime, 1000);
			}

			this.isRunning = !this.isRunning;
		},
		decrementTime() {
			this.timer > 0 && (this.timer = parseInt(this.timer) - 1);
		},
		saveWord() {
			if (this.newWord !== "") {
				var wordId = wordsRef.doc().id;
				wordsRef.doc(wordId).set({
					id: wordId,
					word: this.newWord
				});
			}

			this.newWord = "";
			this.getAllWords();
		},
		getAllWords() {
			wordsRef
				.orderBy("word")
				.get()
				.then((querySnap) => {
					this.words = querySnap.docs.map((doc) => doc.data());
				});
		},
		getWords() {
			let query = wordsRef.limit(1).orderBy("word");

			if (this.word) {
				query = query.startAfter(this.finalDoc);
			}

			query.get().then((querySnap) => {
				this.finalDoc = querySnap.docs[0];
				var finalDocData = "";
				finalDocData = this.finalDoc.data();
				this.word = finalDocData.word;
			});
		}
	},
	mounted() {
		this.sendMessage();
		this.deleteChat();
		this.removeAllPlayer();

		playerRef.onSnapshot(
			(querySnapshot) =>
				(this.players = querySnapshot.docs.map((doc) => doc.data()))
		);

		messageRef.orderBy("time", "asc").onSnapshot((snapshot) => {
			var messages = [];
			snapshot.forEach((doc) => {
				messages.push(doc.data());
			});
			this.messages = messages.reverse().slice(0, 6);
		});
	}
});

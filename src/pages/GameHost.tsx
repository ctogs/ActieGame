import { useEffect, useRef, useState } from "react";
import { endGame, endRound, makeNewRound, updatePlayerPoints } from "../helpers/database";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from 'use-timer'
import { useAuthState } from "react-firebase-hooks/auth";

export function GameHost() {
  const navigate = useNavigate();
  const numRounds = useRef(0);
  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID

  const [actor1Name, setActor1Name] = useState("");
  const [actor2Name, setActor2Name] = useState("");
  const [actor1ImageURL, setActor1ImageURL] = useState("");
  const [actor2ImageURL, setActor2ImageURL] = useState("");
  const [movies, setMovies] = useState<string[]>([]);
  const [formValue, setFormValue] = useState("");
  const [user] = useAuthState(auth);

  const { time, start, pause, reset } = useTimer({
    initialTime: 15,
    timerType: "DECREMENTAL",
    endTime: 0,
    onTimeOver: async () => {
      console.log('number of rounds after a round runs out of time: ' + numRounds.current)
      if (numRounds.current > 5) {
        console.log("number of rounds is above 5")
        reset();
        await endGame(gameRoomsRef, roomID)
      } else {
        console.log("increasing numrounds")
        numRounds.current++;
        await makeNewRound(gameRoomsRef, roomID)
        reset();
        start();
        console.log("the end of the ontimeover function")
      }
      // console.log("timer in host has fucking ended bitch")

    }
  });

  useEffect(() => {
    console.log("in gameHost.tsx now " + new Date().getSeconds() + "." + new Date().getMilliseconds())
    start();
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        if (!docData.start){
          navigate(`/leaderboard/${roomID}`)
        } else {
          console.log("increasing numrounds")
          numRounds.current += 0.25;
          setActor1Name(docData.actor1Name)
          setActor2Name(docData.actor2Name)
          setActor1ImageURL(docData.actor1Image)
          setActor2ImageURL(docData.actor2Image)
          setMovies(docData.movies)
          reset();
          // could wait a couple seconds before starting new round
          start();          
        }
        console.log("the onSpapshot bullshit is running in GameHost")
      }
    })

    return () => {
      unsub();
    };
  }, [])

  const makeAGuess = () => {
    movies.forEach(async (movie) => {
      if (formValue.toLowerCase() == movie.toLowerCase() && user) {
        console.log("You guessed it!")
        if (numRounds.current > 5){
          await endGame(gameRoomsRef, roomID);
        } else {
          await updatePlayerPoints(gameRoomsRef, roomID, user, time)
          await makeNewRound(gameRoomsRef, roomID)
          setFormValue("")        
        }
      } else {
        console.log("You're an idiot. Try again.")
        setFormValue("")
      }
    })
  }
  
  return (
    <>
      <h1>GameHost</h1>
      {/* <LeaderBoard /> */}
      <h3>{user?.displayName}</h3>
      <h2>number of rounds: {numRounds.current}</h2>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reset}>Reset</button> <br />
      <div className="actor-container">
        <div className="actor">
          <img src={actor1ImageURL} alt="actor1img" />
          <h3>{actor1Name}</h3> 
        </div>
        <div className="actor">
          <img src={actor2ImageURL} alt="actor2img" /> 
          <h3>{actor2Name}</h3> 
        </div>
      </div>

      {time} seconds remaining <br />
      <form onSubmit={(e) => e.preventDefault()}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="What's your fucking guess?" /><br></br>
        <button onClick={makeAGuess}>Guess</button>
      </form>
    </>
  )
}
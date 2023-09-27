import { collection, onSnapshot, doc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { endRound, isCorrectGuess, makeNewRound, updatePlayerPoints } from "../helpers/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTimer } from "use-timer";

export function GamePlayer() {
  const navigate = useNavigate();
  const [actor1Name, setActor1Name] = useState("");
  const [actor2Name, setActor2Name] = useState("");
  const [actor1ImageURL, setActor1ImageURL] = useState("");
  const [actor2ImageURL, setActor2ImageURL] = useState("");
  const [movies, setMovies] = useState<string[]>([]);
  const [formValue, setFormValue] = useState("");
  const [user] = useAuthState(auth);

  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID

  const { time, start, pause, reset } = useTimer({
    initialTime: 15,
    timerType: "DECREMENTAL",
    endTime: 0,
    onTimeOver: async () => {
      reset();
      start();
    }
  });

  useEffect(() => {
    console.log("in gamePlayer.tsx now " + new Date().getSeconds() + "." + new Date().getMilliseconds())
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        if (!docData.start) navigate(`/leaderboard/${roomID}`)
        setActor1Name(docData.actor1Name)
        setActor2Name(docData.actor2Name)
        setMovies(docData.movies)
        setActor1ImageURL(docData.actor1Image)
        setActor2ImageURL(docData.actor2Image)
        reset();
        start();
      }
    })

    return () => {
      unsub();
    }
  }, [])

  const makeAGuess = () => {
    movies.forEach(async (movie) => {
      if (isCorrectGuess(formValue, movie) && user) {
        console.log("You guessed it!")
        await updatePlayerPoints(gameRoomsRef, roomID, user, time)
        await makeNewRound(gameRoomsRef, roomID)
        setFormValue("")
      } else {
        console.log("You're an idiot. Try again.")
        setFormValue("")
      }
    })
  }
  return (
    <>
      <h1>GamePlayer</h1>
      <h3>{user?.displayName}</h3>
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
import { useEffect, useRef, useState } from "react";
import { endGame, endRound, isCorrectGuess, makeNewRound, updatePlayerPoints } from "../helpers/database";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from 'use-timer'
import { useAuthState } from "react-firebase-hooks/auth";
import Popup from "reactjs-popup";
import { LeaderBoard } from "./LeaderBoard";


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

  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const { time, start, pause, reset } = useTimer({
    initialTime: 15,
    timerType: "DECREMENTAL",
    endTime: 0,
    onTimeOver: async () => {
      if (numRounds.current > 10) {
        reset();
        await endGame(gameRoomsRef, roomID)
      } else {
        numRounds.current += 0.5;
        reset();
        await makeNewRound(gameRoomsRef, roomID);
        showLeaderBoardThenStart();
      }
    }
  });

  useEffect(() => {
    start();
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        if (!docData.start){
          navigate(`/leaderboard/${roomID}`)
        } else if(numRounds.current > 10){
          (async () => {
            await endGame(gameRoomsRef, roomID)
          }) ();
        } else {
          reset();
          showLeaderBoardThenStart();   
          numRounds.current += 0.5
          setActor1Name(docData.actor1Name)
          setActor2Name(docData.actor2Name)
          setActor1ImageURL(docData.actor1Image)
          setActor2ImageURL(docData.actor2Image)
          setMovies(docData.movies)     
        }
      }
    })

    return () => {
      unsub();
    };
  }, [])

  const makeAGuess = () => {
    movies.forEach(async (movie) => {
      if (isCorrectGuess(formValue, movie) && user) {
        console.log("You guessed it!")
        if (numRounds.current > 10) {
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

  const showLeaderBoardThenStart = () => {
    setOpen(true)
    setTimeout(() => {
      setOpen(false);
      start();
    }, 7000);
  }

  return (
    <>
      <h1>GameHost</h1>
      <h3>{user?.displayName}</h3>
      <h2>number of rounds: {numRounds.current}</h2>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reset}>Reset</button> <br />

      <button onClick={showLeaderBoardThenStart}>Show leaderboard</button>
      <div>
        <Popup open={open} closeOnDocumentClick={false} onClose={closeModal} closeOnEscape={false} lockScroll>
          <div className="modal">
            <LeaderBoard />
          </div>
        </Popup>
      </div> <br />

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
      <div>

    </div>
      {time} seconds remaining <br />
      <form onSubmit={(e) => e.preventDefault()}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="What's your fucking guess?" /><br></br>
        <button onClick={makeAGuess}>Guess</button>
      </form>
    </>
  )
}
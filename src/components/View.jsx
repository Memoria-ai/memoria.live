import React, { useEffect, useRef, useState } from "react";
import styles from "./View.module.css";
// import Search from './Search'
import * as Img from "../imgs";
import Multiselect from "./Multiselect";
import Select from "./Select";
import ThoughtCard from "./ThoughtCard";

const View = ({ session }) => {
  const [userNotes, setUserNotes] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [countedTags, setCountedTags] = useState({});
  const [visibleTags, setVisibleTags] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [numQueries, setNumQueries] = useState();
  const [numWords, setNumWords] = useState(0);
  const [savedTime, setSavedTime] = useState(0);
  const [showSavedTime, setShowSavedTime] = useState(false);
  const [sortOption, setSortOption] = useState("Most Recent");
  const [isOpen, setIsOpen] = useState();
  const [curNote, setCurNote] = useState();
  const [showNote, setShowNote] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState();

  const local = "http://localhost:8000/";
  const server = "https://memoria-ai.herokuapp.com/";
  const current = local;

  const fetchNumQueries = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    // console.log('token: ', token);
    const response = await fetch(current + "fetchNumQueries/" + userId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    const num_queries = parseInt(data, 10);
    setNumQueries(num_queries);
    return num_queries;
  };

  const calcNumWords = (notes) => {
    var curWords = 0;
    for (const note of notes) {
      curWords += note.content.split(" ").length;
    }
    setNumWords(curWords);
    return curWords;
  };

  // const visibleTags = userTags === undefined ? [] : (showAllTags ? userTags : userTags.slice(0, 3));

  // Every time this is rendered, useEffect is called.
  useEffect(() => {
    fetchUserNotes();
    getUserTags();
  }, [session]);

  const calcSavedTime = async (notes) => {
    const num_queries = await fetchNumQueries();
    const num_words = calcNumWords(notes);
    setSavedTime(
      Math.round(10 * (num_queries * 2.31 + 0.019 * num_words)) / 10
    );
    setShowSavedTime(true);
  };

  const handleTagSelection = (tags) => {
    // if (selectedTags.includes(tag)) {
    //   setSelectedTags(selectedTags.filter(selectedTag => selectedTag !== tag));
    // } else {
    //   setSelectedTags([...selectedTags, tag]);
    // }
    setSelectedTags(tags);
  };

  // Get notes from database and show it to user.

  const fetchUserNotes = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    // console.log('token: ', token);
    const response = await fetch(current + "fetchNotes/" + userId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`, // Include the JWT token in the 'Authorization' header
      },
    });

    const notes = await response.json();
    setUserNotes(notes);
    calcSavedTime(notes);
  };

  // Get all tags from database and show it to user.
  const getUserTags = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const response = await fetch(current + "getUserTags/" + userId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const tags = await response.json();
    setAllTags(tags);
    return tags;
  };

  // Deletes 'id' note.
  const deleteNote = async (id) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    // console.log('token: ', token);
    const response = await fetch(current + "deleteNote/" + userId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ id, userId }),
    });
    const result = await response.json();
    await fetchUserNotes();
    await getUserTags();
  };

  const playNote = async (path) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    // console.log('token: ', token);
    fetch(current + "fetchNoteAudio/" + userId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ path: path }),
    })
      .then((response) => response.arrayBuffer())
      .then((audioBuffer) => {
        const audioBlob = new Blob([audioBuffer], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        audioElement.play();
      });
  };

  const toggleContent = (noteId) => {
    if (expandedNotes?.includes(noteId)) {
      setExpandedNotes((prevNotes) => prevNotes.filter((id) => id !== noteId));
    } else {
      setExpandedNotes((prevNotes) => [...prevNotes, noteId]);
    }
  };

  const sortedNotes = userNotes
    .filter((note) => {
      if (selectedTags.length === 0) {
        return true; // Show all notes if no tags selected
      }
      if (!note) {
        return false;
      }
      return selectedTags.every((tag) => note.Tags && note.Tags.includes(tag));
    })
    .sort((a, b) => {
      if (sortOption == "Most Recent") {
        return b?.timestamp.localeCompare(a?.timestamp);
      } else if (sortOption == "Oldest") {
        return a?.timestamp.localeCompare(b?.timestamp);
      }
    });

  const sortOptions = [
    {
      option: "Most Recent",
      value: 1,
    },
    {
      option: "Oldest",
      value: 2,
    },
  ];

  const handleSortSelection = (option) => {
    setSortOption(option.option);
  };

  const editNote = (note) => {
    setCurNote(note);
    setShowNote(true);
  };

  const handleEdit = (note) => {
    editNote(note);
    setIsOpen(false);
  };

  const handleDelete = (noteId) => {
    deleteNote(noteId);
    setIsOpen(false);
  };

  const handleClick = (noteId) => {
    setIsOpen((prevState) => (prevState === noteId ? false : noteId));
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className={styles.body}>
      <h3>My Thoughts</h3>
      <div className={showSavedTime ? styles.savedTime : styles.hidden}>
        You've saved{" "}
        <span className={"gradientText1"}> {savedTime} minutes </span> using
        Memoria!
      </div>
      <div className={styles["select-container"]}>
        Filter:
        <Multiselect onChange={handleTagSelection} options={allTags} />
      </div>
      <div className={styles["select-container"]}>
        Sort:
        <Select onChange={handleSortSelection} options={sortOptions} />
      </div>
      <div className={styles.gallery}>
        {sortedNotes.map((note) => (
          <div className={styles.thoughtCard} key={note?.id}>
            <h3 className={styles.noteTitle}>{note?.title}</h3>
            <p className={styles.transcript}>
              {!expandedNotes?.includes(note?.id) && note?.content.length > 120
                ? note?.content.slice(0, 120)
                : note?.content}
              {note?.content.length > 120 ? (
                <span
                  onClick={() => toggleContent(note?.id)}
                  className={styles.seeMore}
                >
                  {!expandedNotes?.includes(note?.id)
                    ? "...See More"
                    : "...See Less"}
                </span>
              ) : (
                ""
              )}
            </p>
            <div className={styles.tagList}>
              {note?.Tags?.map((tag) => (
                <div className={styles.tag} key={tag}>
                  {tag}
                </div>
              ))}
            </div>
            <div className={styles.cardBottom}>
              <p className={styles.description}>
                {new Date(note?.timestamp).toLocaleDateString()}
              </p>
              <div
                tabIndex={0}
                onBlur={() => handleBlur(note?.id)}
                className={styles["more-container"]}
              >
                <div>
                  <button
                    onClick={() => handleClick(note?.id)}
                    className={styles.deleteButton}
                  >
                    <Img.MoreHorizIcon />
                  </button>
                </div>
                <div
                  className={`${styles["more-menu"]}
                ${isOpen === note?.id ? styles.show : ""}`}
                >
                  <div>
                    <button
                      className={styles.button1}
                      onClick={() => handleDelete(note?.id)}
                    >
                      Delete
                    </button>
                    <button
                      className={styles.button1}
                      onClick={() => handleEdit(note)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={showNote ? styles.thoughtCard : styles.hidden}>
        <ThoughtCard
          onActivity={() => setShowNote(false)}
          note={curNote}
          session={session}
        />
      </div>
    </div>
  );
};

export default View;

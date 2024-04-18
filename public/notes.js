let currentNoteId = null;
let isOnNewNote = false;


function deleteNote(noteId) {
    fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            loadNotes();
            newNote();
        })
        .catch(error => console.error('Failed to delete note:', error));
}


function newNote() {
    if (!isOnNewNote) {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        currentNoteId += 1;
        isOnNewNote = true;
    }
}


function loadNoteDetails(note) {
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    currentNoteId = note.id;
    isOnNewNote = false;
}


function loadNotes() {
    fetch('/api/notes', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(notes => {
            const notesList = document.getElementById('notesIndex');
            notesList.innerHTML = '';
            console.log(notes)
            if (notes.length) {
                notes.forEach(note => {
                    let li = document.createElement('li');
                    li.className = 'note-item';

                    let noteButton = document.createElement('button');
                    noteButton.className = 'note-btn';
                    noteButton.textContent = note.title;
                    noteButton.onclick = function() { loadNoteDetails(note); };

                    let deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-btn';
                    deleteButton.textContent = 'X';
                    deleteButton.onclick = function() {
                        deleteNote(note.id);
                    };

                    li.appendChild(noteButton);
                    li.appendChild(deleteButton);
                    notesList.appendChild(li);
                });
                let noteObj = notes[notes.length - 1]
                currentNoteId = noteObj.id
                isOnNewNote = false
                document.getElementById('noteTitle').value = noteObj.title
                document.getElementById('noteContent').value = noteObj.content
            } else {
                currentNoteId = 0
                isOnNewNote = true
            }


        })
        .catch(error => console.error('Failed to load notes:', error));
}


function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const method = !isOnNewNote ? 'PUT' : 'POST';
    const url = !isOnNewNote ? `/api/notes/${currentNoteId}` : '/api/notes';

    fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            loadNotes();
            isOnNewNote = false;
        })
        .catch(error => {
            alert('Failed to save/update note:\n' + error)
            console.error('Failed to save/update note:', error)
        });
}

document.addEventListener("DOMContentLoaded", loadNotes);

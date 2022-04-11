function validateBeforeSend(event)
{
    const taskField = document.getElementById("taskInput");
    if (taskField.value.trim() == "")
    {
        console.log("EMPTY!");
        event.presentDefault(); //stop the event in its tracks... don't send to the server 
        return; 
    }

    console.log("sending to the server...")
}


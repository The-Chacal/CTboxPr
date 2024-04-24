/**
 * Parses all the layers where there is a selected shot and does an export based on the clips of the layer.
 */
function exportShots(){
    app.enableQE();
    //Saving the active Sequence.
    var currentSequence = app.project.activeSequence ;
    var qeSequence = qe.project.getActiveSequence(0) ;
    if( currentSequence == 0 ){ alert( "No active Sequence." ); return ;}
    //Getting Video Tracks layers.
    var videoTracks = currentSequence.videoTracks ;
    //Parsing the Video Tracks to find a selection.
    var tracksToAnalyse = [];
    var qeTracksToAnalyse = [];
    for( var i = 0 ; i < videoTracks.numTracks ; i++ ){
        var trackClips = videoTracks[i].clips ;
        if( !videoTracks[i].isMuted() && trackClips.numItems > 0 ){
                for( var j = 0 ; j < trackClips.numItems ; j++ ){
                if( trackClips[j].isSelected() ){
                    //Saving the Tracks with a selection.
                    tracksToAnalyse.push( videoTracks[i] );
                    qeTracksToAnalyse.push( qeSequence.getVideoTrackAt(i) );
                    break;
                }
            }
        }
    }
    if( tracksToAnalyse.length < 1 ){ alert( "No selection detected." ); return ; }
    //Preparing the export.
    var destinationFolder = Folder.myDocuments.selectDlg( "Where do you want to save the exports?" );
    if( destinationFolder == null ){ return ; }

    //Asking if the user wants a formatted name for the exports.
    var nameTemplate = prompt( "   Please enter the prefix for your exports." , "sc_" , "Do you want to format the name of your exports?" )
    if( nameTemplate == null ){ nameTemplate = "" ; }
    //Saving the original In and Out points for the active Sequence.
    var originalInPoint = currentSequence.getInPointAsTime().ticks ;
    var originalOutPoint = currentSequence.getOutPointAsTime().ticks ;
    //Getting the path to the preset Folder.
    var AMElastVersion = getAMElastVersionFolder();
    //Parsing saved Layers and exporting all the clips on it individually.
    for( i = 0 ; i < tracksToAnalyse.length ; i++ ){
        var emptyClipsNb = 0 ;
        var a = 0 ;//Creating a variable for the vanilla clips.
        for( j = 0 ; j < qeTracksToAnalyse[i].numItems ; j++ ){
            var currentQEclip = qeTracksToAnalyse[i].getItemAt(j);
            if( currentQEclip.type.toString() != "Empty" ){//Checking the type of the clips since QEclips also take empty spaces as clips.
                a = j - emptyClipsNb ;
                //Adding the metadata Effect.
                var effectAdded = currentQEclip.addVideoEffect( qe.project.getVideoEffectByName( "Incrustation des métadonnées et du code temporel" ) );
                if( !effectAdded ){
                    effectAdded = currentQEclip.addVideoEffect( qe.project.getVideoEffectByName( "Nom de l’élément" ) );
                }
                //Getting the vanilla Clip matching the QEclip.
                var currentClip = tracksToAnalyse[i].clips[a];
                //Formating the number for the shot so it starts at 1 and is a 4 digits number.
                var nb = ( ( a + 1 ) * 10 ).toString();
                while( nb.length < 4 ){
                    nb = "0" + nb ;
                }
                shotName = shotName + nb + " | " ;
                //Saving and Templating the name of the clip.
                var clipOldName = currentClip.name ;
                currentClip.name = nameTemplate + nb ;
                //Getting the metadata Effect and updating its settings.
                for( var k = 0 ; k < currentClip.components.numItems ; k++ ){
                    if( currentClip.components[k].displayName == "Incrustation des métadonnées et du code temporel" ){
                        currentClip.components[k].properties[3].setValue( 20 , 1 );
                        currentClip.components[k].properties[4].setValue( [ .025 , .100 ] , 1 );
                        break ;
                    } else if( currentClip.components[k].displayName == "Nom de l’élément" ){
                        currentClip.components[k].properties[0].setValue( [ .025 , .100 ] , 1 );
                        currentClip.components[k].properties[1].setValue( 0 , 1 );
                        currentClip.components[k].properties[2].setValue( 50 , 1 );
                        break ;
                    }
                }
                //Saving the in and out points of the sequence
                var startTime = currentClip.start.ticks ;
                var endTime = currentClip.end.ticks ;
                //Setting the in and out points of the sequence to the Clip in and out.
                currentSequence.setInPoint( startTime );
                currentSequence.setOutPoint( endTime );
                //Exporting the clip according the preset CTbox created by the user.
                if( $.os.search( "Windows" ) != - 1 ){
                    currentSequence.exportAsMediaDirect( destinationFolder.fsName + "\\" + currentClip.name + ".mp4" , AMElastVersion.fsName + "\\Presets\\CTbox.epr" , 1 );
                } else {
                    currentSequence.exportAsMediaDirect( destinationFolder.fsName + "/" + currentClip.name + ".mp4" , AMElastVersion.fsName + "/Presets/CTbox.epr" , 1 );
                }
                //Removing the metadata Effect.
                if( effectAdded ){
                    currentQEclip.getComponentAt(k).remove();
                }
                //Creating a JPG vignette for the clip exported according to the CTbox-JPEG preset.
                currentSequence.setInPoint( ( Math.floor( ( parseInt( startTime ) + parseInt( endTime ) ) / 2 ) ).toString() );
                currentSequence.setOutPoint( ( Math.floor( ( parseInt( startTime ) + parseInt( endTime ) ) / 2 ) + parseInt( currentSequence.timebase ) ).toString() );
                if( $.os.search( "Windows" ) != - 1 ){
                    currentSequence.exportAsMediaDirect( destinationFolder.fsName + "\\" + currentClip.name + ".jpeg" , AMElastVersion.fsName + "\\Presets\\CTbox-JPEG.epr" , 1 );
                } else {
                    currentSequence.exportAsMediaDirect( destinationFolder.fsName + "/" + currentClip.name + ".jpeg" , AMElastVersion.fsName + "/Presets/CTbox-JPEG.epr" , 1 );
                }
                //Restoring Clip name.
                currentClip.name = clipOldName ;
            } else {
                emptyClipsNb++ ;
            }
        }
    }
    //Retoring the original in and out point.
    currentSequence.setInPoint( originalInPoint );
    currentSequence.setOutPoint( originalOutPoint );
}
/**
 * Gets all the folders in the AME folder of the user and pick the one with the highest version.
 * @returns { object } The Folder object with the highest version number.
 */
function getAMElastVersionFolder(){

    var AMEfolder = new Folder( Folder.myDocuments.fsName + "/Adobe/Adobe Media Encoder" );
    var AMEfolderContent = AMEfolder.getFiles( /[0-9]{2}\.[0-9]/ );
    var versionForTest = [ 0 , 0 ]
    var lastVersionIndex = 0
    for( var i = 0 ; i < AMEfolderContent.length ; i++ )
    {
        var versionToTest = AMEfolderContent[i].name.slice( AMEfolderContent[i].name.search( /[0-9]{2}/gm ) , AMEfolderContent[i].name.search( /\.[0-9]/gm ) + 2 ).split(".");
        if( versionToTest[0] - versionForTest[0] > 0 ){ 
            versionForTest = versionToTest ;
            lastVersionIndex = i ;
        } else if( versionToTest[0] - versionForTest[0] > -1 ){
            if( versionToTest[1] - versionForTest[1] > 0 ){
                versionForTest = versionToTest ;
                lastVersionIndex = i ;
            }
        }
    }
    return AMEfolderContent[ lastVersionIndex ]
}
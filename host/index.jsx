function exportShots(){
    //Saving the active Sequence.
    var currentSequence = app.project.activeSequence ;
    if( currentSequence == 0 ){ alert( "No active Sequence." ); return ;}
    //Getting Video Tracks layers.
    var videoTracks = currentSequence.videoTracks ;
    //Parsing the Video Tracks to find a selection.
    var tracksToAnalyse = [] ;
    for( var i = 0 ; i < videoTracks.numTracks ; i++ ){
        var trackClips = videoTracks[i].clips ;
        if( !videoTracks[i].isMuted() && trackClips.numItems > 0 ){
            for( var j = 0 ; j < trackClips.numItems ; j++ ){
                if( trackClips[j].isSelected() ){
                    //Saving the Tracks with a selection.
                    tracksToAnalyse.push( videoTracks[i] );
                    break;
                }
            }
        }
    }
    if( tracksToAnalyse.length < 1 ){ alert( "No selection detected." ); return ; }
    //Saving the original In and Out points for the active Sequence.
    var originalInPoint = currentSequence.getInPointAsTime().ticks ;
    var originalOutPoint = currentSequence.getOutPointAsTime().ticks ;
    //Parsing saved Layers and exporting all the clips on it individually.
    for( i = 0 ; i < tracksToAnalyse.length ; i++ ){
        for( j = 0 ; j < tracksToAnalyse[i].clips.numItems ; j++ ){
            var currentClip = tracksToAnalyse[i].clips[j];
            var startTime = currentClip.start.ticks ;
            var endTime = currentClip.end.ticks ;
            currentSequence.setInPoint( startTime );
            currentSequence.setOutPoint( endTime );
            currentSequence.exportAsMediaDirect( "D:\\TestPremiere\\" + currentClip.name + ".mov" , "C:\\Users\\SylvainL\\Documents\\Adobe\\Adobe Media Encoder\\23.0\\Presets\\H264.epr" , 1 );
        }
    }
    currentSequence.setInPoint( originalInPoint );
    currentSequence.setOutPoint( originalOutPoint );
}
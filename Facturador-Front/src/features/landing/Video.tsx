import React, { useState } from 'react';
import { FaPlay } from 'react-icons/fa';

const Video = () => {
  const [playVideo, setPlayVideo] = useState(false);

  return (
    <div className="px-[25px] md:px-0 md:w-[1082px] h-[222px] md:h-[557px] bg-[#E8EDF0] rounded-[40px] mt-[99px] mx-auto flex justify-center items-center">
      {playVideo ? (
        <iframe
          className="w-[850px] h-[154px] md:h-[410px] rounded-[20px]"
          src="https://www.youtube.com/embed/Mqpxbaoozbs?autoplay=1"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <div
          className="flex justify-center items-center w-[850px] h-[154px] md:h-[410px] rounded-[20px] bg-[url('https://res.cloudinary.com/decbwosgj/image/upload/v1737644960/Captura_de_pantalla_de_2025-01-23_11-07-20_ipnyej.png')] bg-cover bg-start cursor-pointer"
          onClick={() => setPlayVideo(true)}
        >
          <div className="bg-[#00A7E1] w-[70px] md:w-[100px] h-[70px] md:h-[100px] rounded-full relative flex justify-center items-center">
            <FaPlay className="text-white absolute text-[19px] md:text-[35px] right-[23px] md:right-[28px]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Video;

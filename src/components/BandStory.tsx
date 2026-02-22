import React from 'react';
import { Topic } from '../types';

interface BandStoryProps {
  topic: Topic;
}

const BandStory: React.FC<BandStoryProps> = ({ topic }) => {
  return (
    <div className="space-y-8 pb-10">
      {topic.dialog.title && (
        <h2 className="text-3xl font-black text-indigo-600 mb-4">
          {topic.dialog.title}
        </h2>
      )}
      
      <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video relative border-4 border-white">
        <iframe 
          src={topic.dialog.videoUrl || topic.videoUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          title="Band Story"
        ></iframe>
      </div>

      {topic.dialog.text && topic.id !== 'house-cleaning' && topic.id !== 'job-interview' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold text-gray-500 mb-3 uppercase tracking-wider">Немецкий текст</h4>
              <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                {topic.dialog.text}
              </div>
            </div>
            {topic.dialog.translation && (
              <div>
                <h4 className="text-lg font-bold text-gray-500 mb-3 uppercase tracking-wider">Перевод</h4>
                <div className="text-lg leading-relaxed text-gray-600 whitespace-pre-line">
                  {topic.dialog.translation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BandStory;




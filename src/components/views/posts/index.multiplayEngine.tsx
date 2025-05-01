'use client';

import { useEffect } from 'react';

import type { EngineCoreType } from '@/3d/Engines/EngineCore';
import { MultiplayEngine } from '@/3d/Engines/MultiplayEngine';
import type { Post } from '@/apis/entities';
import { useMultiplayEngineStore } from '@/stores/engineStores/useMultiplayEngineStore';

export type PostPageProps = {
  post: Post;
  engineCore: EngineCoreType
};

const PostPageMultiplayEngine: React.FC<PostPageProps> = ({ post, engineCore }) => {
  const multiplayEngine = useMultiplayEngineStore(state => state.multiplayEngine);
  const setMultiplayEngine = useMultiplayEngineStore(state => state.setMultiplayEngine);
  const disposeMultiplayEngine = useMultiplayEngineStore(state => state.disposeMultiplayEngine);

  useEffect(() => {
    if (multiplayEngine && localStorage.getItem('changePost')) {
      multiplayEngine?.dispose();
    }

    (async () => {
      const newMultiplayEngine = new MultiplayEngine(post, engineCore);
      setMultiplayEngine(newMultiplayEngine);

      // join nakama post room for multiplayer
      newMultiplayEngine.joinNakamaPostRoom();

      // create scene
      newMultiplayEngine.post.createScene().then(() => {
        newMultiplayEngine.createAvatarForUser();
      });
    })();

    return () => {
      disposeMultiplayEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default PostPageMultiplayEngine;
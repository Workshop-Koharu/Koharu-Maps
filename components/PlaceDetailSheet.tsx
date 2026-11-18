'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Share2, 
  Bookmark, 
  Navigation, 
  Check, 
  MessageSquare, 
  ThumbsUp, 
  Send,
  Coffee,
  Utensils,
  Camera,
  Car,
  Wifi,
  Sparkles
} from 'lucide-react';
import { SearchPlace, PlaceReview } from '@/lib/global-data';

interface PlaceDetailSheetProps {
  place: SearchPlace | null;
  onClose: () => void;
  onSetStart: (place: SearchPlace) => void;
  onSetTarget: (place: SearchPlace) => void;
  onAddFavorite: (place: SearchPlace) => void;
  onCopyShareLink: (place: SearchPlace) => void;
  currentUser?: any;
}

export default function PlaceDetailSheet({
  place,
  onClose,
  onSetStart,
  onSetTarget,
  onAddFavorite,
  onCopyShareLink,
  currentUser,
}: PlaceDetailSheetProps) {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!place) return;

    // Load persisted custom reviews from localStorage
    const saved = localStorage.getItem(`koharu_reviews_${place.id}`);
    let localReviews: PlaceReview[] = [];
    if (saved) {
      try {
        localReviews = JSON.parse(saved);
      } catch {}
    }

    const defaultReviews: PlaceReview[] = place.reviews || [
      {
        id: 'rev_default_1',
        author: '지도탐험가',
        rating: 5,
        date: '2026.11.16',
        content: '위치도 찾기 편하고 시설 관리가 정말 깔끔합니다. 다음에 또 방문하고 싶네요!',
        likes: 12,
      },
      {
        id: 'rev_default_2',
        author: '미식여행러',
        rating: 4,
        date: '2026.11.14',
        content: '분위기 좋고 접근성이 훌륭합니다. 주말에는 사람이 많아서 일찍 가는 것을 추천합니다.',
        likes: 7,
      }
    ];

    setReviews([...localReviews, ...defaultReviews]);
    setNewAuthor(currentUser?.name || '');
  }, [place, currentUser]);

  if (!place) return null;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    const authorName = newAuthor.trim() || currentUser?.name || '익명 탐험가';
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    const createdReview: PlaceReview = {
      id: `usr_rev_${Date.now()}`,
      author: authorName,
      rating: newRating,
      date: today,
      content: newContent.trim(),
      likes: 0,
    };

    const updated = [createdReview, ...reviews];
    setReviews(updated);

    // Save only user-written reviews to localStorage
    const saved = localStorage.getItem(`koharu_reviews_${place.id}`);
    let localReviews: PlaceReview[] = [];
    if (saved) {
      try { localReviews = JSON.parse(saved); } catch {}
    }
    localStorage.setItem(`koharu_reviews_${place.id}`, JSON.stringify([createdReview, ...localReviews]));

    setNewContent('');
    setIsSubmitting(false);
    setActiveTab('reviews');
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : (place.rating || 4.8).toFixed(1);

  const fallbackPhoto = place.category.includes('음식') || place.category.includes('식당')
    ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
    : place.category.includes('카페')
    ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80';

  const photoUrl = place.photo || fallbackPhoto;

  return (
    <aside
      className="place-detail-sheet"
      style={{
        position: 'absolute',
        top: 72,
        left: 18,
        width: 380,
        maxHeight: 'calc(100vh - 110px)',
        zIndex: 96,
        background: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInSlide 0.22s ease-out',
      }}
    >
      {/* Photo Header with Category Badge and Close Button */}
      <div style={{ position: 'relative', width: '100%', height: 180, background: '#0f172a', flexShrink: 0 }}>
        <img
          src={photoUrl}
          alt={place.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackPhoto;
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.7) 100%)'
        }} />

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="닫기"
        >
          <X size={16} />
        </button>

        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {place.category}
        </span>

        {/* Place Title & Rating on bottom overlay */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <h2 style={{ color: '#ffffff', fontSize: 19, fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
            {place.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
              <Star size={14} fill="#fbbf24" stroke="none" style={{ marginRight: 3 }} />
              <span>{avgRating}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              ({reviews.length}개 리뷰)
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row (길찾기 / 즐겨찾기 / 공유) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 6,
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onSetStart(place)}
          style={{ flexDirection: 'column', gap: 3, height: 48, padding: 4 }}
          title="출발지로 설정"
        >
          <Navigation size={15} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 600 }}>출발지</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSetTarget(place)}
          style={{ flexDirection: 'column', gap: 3, height: 48, padding: 4 }}
          title="도착지로 설정 (경로 탐색)"
        >
          <Navigation size={15} color="#ffffff" style={{ transform: 'rotate(90deg)' }} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>도착지</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => onAddFavorite(place)}
          style={{ flexDirection: 'column', gap: 3, height: 48, padding: 4 }}
          title="즐겨찾기에 보관"
        >
          <Bookmark size={15} color="#eab308" />
          <span style={{ fontSize: 11, fontWeight: 600 }}>저장</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            onCopyShareLink(place);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{ flexDirection: 'column', gap: 3, height: 48, padding: 4 }}
          title="좌표 공유 링크 복사"
        >
          {copied ? <Check size={15} color="var(--success)" /> : <Share2 size={15} />}
          <span style={{ fontSize: 11, fontWeight: 600 }}>{copied ? '복사됨' : '공유'}</span>
        </button>
      </div>

      {/* Tabs Switcher: 상세 정보 vs 실시간 리뷰 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'none',
            fontSize: 12,
            fontWeight: 700,
            color: activeTab === 'info' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'info' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          장소 상세 정보
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'none',
            fontSize: 12,
            fontWeight: 700,
            color: activeTab === 'reviews' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'reviews' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          사용자 방문 리뷰 ({reviews.length})
        </button>
      </div>

      {/* Tab Content Area (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {activeTab === 'info' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {place.address}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  좌표: {place.lon.toFixed(4)}, {place.lat.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Clock size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 700, color: '#10b981' }}>영업중</span> &middot; {place.hours || '매일 09:30 - 22:00 (연중무휴)'}
              </div>
            </div>

            {/* Telephone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Phone size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {place.phone || '02-730-1928'}
              </div>
            </div>

            {/* Menu or Signature Highlights */}
            {place.menu && place.menu.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Utensils size={14} color="var(--accent)" />
                  <span>대표 메뉴 및 가격 안내</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {place.menu.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Facilities / Amenities Tags */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                편의 시설 및 서비스
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(place.facilities || ['주차 가능', '무료 Wi-Fi', '예약 가능', '남/녀 화장실 구분', '신용카드 결제']).map((fac, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 14,
                      padding: '4px 9px',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={11} color="var(--success)" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Review Submission Form */}
            <form onSubmit={handleAddReview} style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#f59e0b" />
                <span>방문 별점 및 리뷰 남기기</span>
              </div>

              {/* Star Rating Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Star
                      size={20}
                      fill={star <= newRating ? '#fbbf24' : 'none'}
                      stroke={star <= newRating ? '#f59e0b' : 'var(--text-muted)'}
                    />
                  </button>
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginLeft: 6 }}>
                  {newRating}점
                </span>
              </div>

              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="작성자 닉네임 (미입력 시 익명)"
                className="input-text"
                style={{ width: '100%', fontSize: 12, marginBottom: 8, padding: '6px 10px' }}
              />

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="시설, 음식 맛, 서비스 등에 대한 솔직한 방문 경험을 남겨주세요."
                rows={3}
                className="input-text"
                style={{ width: '100%', fontSize: 12, resize: 'none', marginBottom: 8, padding: 8 }}
              />

              <button
                type="submit"
                disabled={isSubmitting || !newContent.trim()}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Send size={13} />
                <span>리뷰 등록하기</span>
              </button>
            </form>

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {rev.author}
                      </span>
                      <div style={{ display: 'flex', color: '#fbbf24' }}>
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} fill="#fbbf24" stroke="none" />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rev.date}</span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: '6px 0 8px 0' }}>
                    {rev.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    <ThumbsUp size={11} />
                    <span>도움됨 {rev.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

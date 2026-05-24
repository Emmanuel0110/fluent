import React, { useEffect, useState, useRef } from "react";
import { fetchFeedbacks } from "../APICalls";
import "./AdminFeedbacks.css";
import { useTranslation } from "react-i18next";

interface Feedback {
  _id: string;
  comment: string;
  pageUrl: string;
  userId: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const FEEDBACKS_PER_PAGE = 50;

function AdminFeedbacks() {
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFeedbacks(currentPage, FEEDBACKS_PER_PAGE);
        if (result.feedbacks && Array.isArray(result.feedbacks)) {
          setFeedbacks(result.feedbacks);
          setPagination(result.pagination);
        } else {
          setError(t("admin.load_error"));
        }
      } catch (err: any) {
        setError(err.message || t("admin.load_error"));
      } finally {
        setLoading(false);
      }
    };
    loadFeedbacks();
  }, [currentPage]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, loading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-feedbacks-loading">
        <p>{t("admin.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-feedbacks-error">
        <p>{error}</p>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pages.push(
      <button
        key="prev"
        className="admin-pagination-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!pagination.hasPrevPage}
      >
        {t("admin.prev")}
      </button>
    );

    if (startPage > 1) {
      pages.push(
        <button key={1} className="admin-pagination-btn" onClick={() => handlePageChange(1)}>
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="admin-pagination-ellipsis">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`admin-pagination-btn ${i === currentPage ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="admin-pagination-ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={pagination.totalPages}
          className="admin-pagination-btn"
          onClick={() => handlePageChange(pagination.totalPages)}
        >
          {pagination.totalPages}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        className="admin-pagination-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!pagination.hasNextPage}
      >
        {t("admin.next")}
      </button>
    );

    return <div className="admin-pagination">{pages}</div>;
  };

  return (
    <div className="admin-feedbacks-container" ref={containerRef}>
      <div className="admin-feedbacks-header">
        <h1>{t("admin.feedbacks_title")}</h1>
        <p className="admin-feedbacks-count">
          {pagination
            ? t("admin.showing", {
                from: (currentPage - 1) * FEEDBACKS_PER_PAGE + 1,
                to: Math.min(currentPage * FEEDBACKS_PER_PAGE, pagination.totalCount),
                total: pagination.totalCount,
              })
            : t("admin.total", { count: feedbacks.length })}
        </p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="admin-feedbacks-empty">
          <p>{t("admin.no_feedbacks")}</p>
        </div>
      ) : (
        <>
          <div className="admin-feedbacks-list">
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className="admin-feedback-item">
                <div className="admin-feedback-header">
                  <div className="admin-feedback-meta">
                    <span className="admin-feedback-date">{formatDate(feedback.createdAt)}</span>
                    <span className="admin-feedback-user">{t("admin.user_id")} {feedback.userId}</span>
                  </div>
                </div>
                <div className="admin-feedback-content">
                  <div className="admin-feedback-comment">
                    <strong>{t("admin.comment")}</strong>
                    <p>{feedback.comment}</p>
                  </div>
                  <div className="admin-feedback-url">
                    <strong>{t("admin.page_url")}</strong>
                    <a href={feedback.pageUrl} target="_blank" rel="noopener noreferrer">
                      {feedback.pageUrl}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default AdminFeedbacks;

use std::collections::VecDeque;
use std::sync::Mutex;

/// Thread-safe queue for buffering incoming file paths across cold startup and subsequent instances.
/// Deliberately handles mutex poisoning to ensure crashes in concurrent handlers never panic other threads.
#[derive(Default)]
pub struct IncomingFileQueue {
    queue: Mutex<VecDeque<String>>,
}

impl IncomingFileQueue {
    /// Creates a new empty pending files queue.
    pub fn new() -> Self {
        Self {
            queue: Mutex::new(VecDeque::new()),
        }
    }

    /// Safely acquires lock on the queue, recovering data even if the mutex was poisoned.
    fn lock_queue(&self) -> std::sync::MutexGuard<'_, VecDeque<String>> {
        self.queue.lock().unwrap_or_else(|p| p.into_inner())
    }

    /// Enqueues a valid file path, preventing duplicate queued entries.
    pub fn push_back(&self, path: String) {
        let mut q = self.lock_queue();
        if !q.contains(&path) {
            q.push_back(path);
        }
    }

    /// Drains and returns all pending file paths from the queue.
    pub fn drain_all(&self) -> Vec<String> {
        let mut q = self.lock_queue();
        q.drain(..).collect()
    }

    /// Returns a snapshot of all currently pending file paths without removing them.
    pub fn peek_all(&self) -> Vec<String> {
        let q = self.lock_queue();
        q.iter().cloned().collect()
    }

    /// Returns true if the queue contains no items.
    pub fn is_empty(&self) -> bool {
        let q = self.lock_queue();
        q.is_empty()
    }

    /// Returns the number of items currently in the queue.
    pub fn len(&self) -> usize {
        let q = self.lock_queue();
        q.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    #[test]
    fn test_queue_initial_empty() {
        let q = IncomingFileQueue::new();
        assert!(q.is_empty());
        assert_eq!(q.len(), 0);
        assert_eq!(q.drain_all(), Vec::<String>::new());
    }

    #[test]
    fn test_queue_push_and_drain() {
        let q = IncomingFileQueue::new();
        q.push_back("C:/test/file1.md".to_string());
        q.push_back("C:/test/file2.markdown".to_string());

        assert_eq!(q.len(), 2);
        assert_eq!(
            q.peek_all(),
            vec![
                "C:/test/file1.md".to_string(),
                "C:/test/file2.markdown".to_string()
            ]
        );

        // Draining empties queue and returns items
        let drained = q.drain_all();
        assert_eq!(drained.len(), 2);
        assert!(q.is_empty());
        assert_eq!(q.len(), 0);
    }

    #[test]
    fn test_queue_deduplicates_exact_paths() {
        let q = IncomingFileQueue::new();
        q.push_back("C:/docs/notes.md".to_string());
        q.push_back("C:/docs/notes.md".to_string());

        assert_eq!(q.len(), 1);
        let items = q.drain_all();
        assert_eq!(items, vec!["C:/docs/notes.md".to_string()]);
    }

    #[test]
    fn test_queue_recovers_from_mutex_poisoning() {
        let q = Arc::new(IncomingFileQueue::new());
        q.push_back("C:/test/file1.md".to_string());

        let q_clone = Arc::clone(&q);
        let _ = std::thread::spawn(move || {
            let _lock = q_clone.queue.lock().unwrap();
            panic!("Intentional test panic to trigger mutex poisoning");
        })
        .join();

        // Mutex is now poisoned, but all methods must continue to work without panicking
        assert_eq!(q.len(), 1);
        q.push_back("C:/test/file2.md".to_string());
        assert_eq!(q.len(), 2);

        let drained = q.drain_all();
        assert_eq!(
            drained,
            vec![
                "C:/test/file1.md".to_string(),
                "C:/test/file2.md".to_string()
            ]
        );
        assert!(q.is_empty());
    }
}

use std::collections::VecDeque;
use std::sync::Mutex;

/// Thread-safe queue for buffering incoming file paths across cold startup and subsequent instances.
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

    /// Enqueues a valid file path, preventing duplicate queued entries.
    pub fn push_back(&self, path: String) {
        let mut q = self.queue.lock().unwrap();
        if !q.contains(&path) {
            q.push_back(path);
        }
    }

    /// Drains and returns all pending file paths from the queue.
    pub fn drain_all(&self) -> Vec<String> {
        let mut q = self.queue.lock().unwrap();
        q.drain(..).collect()
    }

    /// Returns a snapshot of all currently pending file paths without removing them.
    pub fn peek_all(&self) -> Vec<String> {
        let q = self.queue.lock().unwrap();
        q.iter().cloned().collect()
    }

    /// Returns true if the queue contains no items.
    pub fn is_empty(&self) -> bool {
        let q = self.queue.lock().unwrap();
        q.is_empty()
    }

    /// Returns the number of items currently in the queue.
    pub fn len(&self) -> usize {
        let q = self.queue.lock().unwrap();
        q.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
            vec!["C:/test/file1.md".to_string(), "C:/test/file2.markdown".to_string()]
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
}

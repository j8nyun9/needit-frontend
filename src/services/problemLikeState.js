// A list request started before a vote was saved must not undo that vote.
export function mergeSavedLikes(rows, updates, startedRevision, userId){
 return rows.map(row=>{
  const saved=updates.get(String(row.id));
  return saved&&saved.userId===userId&&saved.revision>startedRevision
   ?{...row,liked_by_me:saved.liked_by_me,count:saved.likes_count,likes_count:saved.likes_count}
   :row;
 });
}
